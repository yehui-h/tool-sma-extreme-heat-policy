export interface AboutParagraphRun {
  text: string;
  href: string;
}

export interface AboutParagraph {
  runs: Array<
    | {
        text: string;
      }
    | AboutParagraphRun
  >;
  italic?: boolean;
}

export interface AboutSection {
  title: string;
  paragraphs: AboutParagraph[];
}
