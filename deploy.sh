#!/bin/bash

# Script to build and deploy the dashboard application

# Configuration variables - modify these for different projects
PROJECT_NAME="sma-extreme-heat-policy"
SERVICE="extreme-heat-tool"
# preserve the original service name before we modify SERVICE for test/main
ORIG_SERVICE="$SERVICE"

REGION="asia-southeast1"
MEMORY="8Gi"
CPU="2"
MAX_INSTANCES="50"
ACCOUNT="federicotartarini@gmail.com"
# Use the original service name as the Artifact Registry repository id
REPOSITORY="$ORIG_SERVICE"

# Host and base registry path
REGISTRY_HOST="$REGION-docker.pkg.dev"
REGISTRY_BASE="$REGISTRY_HOST/$PROJECT_NAME"

URL_TEST="https://$PROJECT_NAME-test-987661761927.$REGION.run.app"
URL_MAIN="https://sma-heat-policy.sydney.edu.au"
PORT="8080"

VERSION="1.2.0"

# == End of configuration variables ==

# --- helpers ---
err() { echo "ERROR: $*" >&2; }
info() { echo "INFO: $*"; }

# Check Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    err "Docker daemon does not appear to be running. Start Docker Desktop / Docker Engine and retry."
    exit 1
fi

# create Artifact Registry repo if it doesn't exist (use REPOSITORY)
if ! gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" >/dev/null 2>&1; then
    echo "Creating Artifact Registry repository: $REPOSITORY in $REGION"
    gcloud artifacts repositories create "$REPOSITORY" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repo for $REPOSITORY"
fi

echo "Deploy to test or main environment? (test/main) [test]: "
read version
version=${version:-test}

if [ "$version" != "test" ] && [ "$version" != "main" ]; then
    echo "Invalid input. Please enter 'test' or 'main'."
    exit 1
fi

if [ "$version" == "test" ]; then
    SERVICE="${ORIG_SERVICE}-test"
    IMAGE_NAME="$SERVICE:latest"
    URL=$URL_TEST
else
    SERVICE="${ORIG_SERVICE}"
    IMAGE_NAME="$SERVICE:latest"
    URL=$URL_MAIN
fi

# Full image path must include repository: host/project/repo/image:tag
FULL_IMAGE="$REGISTRY_BASE/$REPOSITORY/$IMAGE_NAME"

echo "Starting build and deploy for $version environment..."

# Check if the app is running locally
if curl -f --max-time 10 http://0.0.0.0:$PORT > /dev/null 2>&1; then
    echo "App is running, proceeding with tests..."
else
    echo "App is not running on http://0.0.0.0:$PORT. Please start the app first."
    exit 1
fi

# Run tests (assuming local unit tests; integration tests may require deployed app)
pipenv run python -m pytest --numprocesses auto --base-url http://0.0.0.0:$PORT --tb=short

# If tests pass, proceed to build and deploy
if [ $? -eq 0 ]; then
    PROCEED=true
else
    echo "Tests failed. Do you want to proceed with deployment anyway? (y/n)"
    read proceed
    if [[ "$proceed" != "y" && "$proceed" != "Y" ]]; then
        err "Aborting deployment."
        exit 1
    fi
fi

gcloud components update --quiet
gcloud config set account $ACCOUNT
gcloud config set project $PROJECT_NAME

# Configure Docker to authenticate to Artifact Registry host
gcloud auth configure-docker "$REGISTRY_HOST" --quiet || true

echo "Building and pushing image: $FULL_IMAGE"

# Build and push in one step. If buildx push fails, fall back to docker push.
if docker buildx build --platform linux/amd64 -t "$FULL_IMAGE" --push .; then
    echo "Image built and pushed: $FULL_IMAGE"
else
    echo "buildx push failed, attempting a regular build + docker push fallback..."
    docker build --platform linux/amd64 -t "$FULL_IMAGE" .
    docker push "$FULL_IMAGE"
fi

echo "Deploying to Cloud Run: $SERVICE"

gcloud run deploy "$SERVICE" \
      --image "$FULL_IMAGE" \
      --region $REGION \
      --memory $MEMORY \
      --platform managed \
      --allow-unauthenticated \
      --tag "v${VERSION//./-}" \
      --cpu $CPU \
      --max-instances $MAX_INSTANCES

echo "Deployment completed. Access the application at: $URL"

if [ "$version" == "test" ]; then
    echo "Deleting inactive revisions for test service..."
    inactive_revisions=($(gcloud run revisions list --platform managed --service $SERVICE --region $REGION --filter="status.conditions.type:Active AND status.conditions.status:'False'" --format='value(metadata.name)'))
    for ((i=2; i<${#inactive_revisions[@]}; i++)); do
      echo "Deleting revision: ${inactive_revisions[i]}"
      gcloud run revisions delete ${inactive_revisions[i]} --region $REGION --quiet
    done
fi

echo "Running post-deployment tests..."
pipenv run python -m pytest --numprocesses auto --base-url $URL --tb=short
