import type { AboutSection } from '@/features/about/types'

export const aboutSections: AboutSection[] = [
  {
    title: 'The University of Sydney Sports Heat Tool',
    paragraphs: [
      'This website provides a convenient and freely accessible tool for assessing heat stress risk during sport and physical activity in Australia.',
      'It is based on the SMA Extreme Heat Risk and Response Guidelines and the associated University of Sydney research publication.',
    ],
    links: [
      {
        label: 'SMA Extreme Heat Risk and Response Guidelines',
        href: 'https://sma.org.au/resources/policies-and-guidelines/hot-weather/',
      },
      {
        label: 'Journal publication',
        href: 'https://www.jsams.org/article/S1440-2440(25)00069-6/fulltext',
      },
    ],
  },
  {
    title: 'Functionalities',
    paragraphs: [
      'The tool supports common sports in Australia and characterises activities based on clothing insulation, metabolic demand, and expected duration.',
      'Users can review location-specific hourly heat stress estimates, hierarchical risk reduction actions, and a 7-day risk forecast.',
    ],
  },
  {
    title: 'Heat Illness Guidance',
    paragraphs: [
      'Vigorous exercise in hot weather increases heat illness risk and may progress to life-threatening heat stroke if unmanaged.',
      'Players, coaches, support staff, and health professionals should apply practical risk reduction guidance, including hydration, shade access, and activity modification.',
    ],
    links: [
      {
        label: 'Beat the Heat fact sheet',
        href: 'https://sma.org.au/wp-content/uploads/2023/03/beat-the-heat-2011.pdf',
      },
    ],
  },
  {
    title: 'UV Exposure & Heat Illness Guide',
    paragraphs: [
      'A joint venture between Sports Medicine Australia Smartplay and Cancer Council Sunsmart provides practical guidance on UV exposure and heat illness prevention.',
    ],
    links: [
      {
        label: 'Guidelines download',
        href: 'https://sma.org.au/wp-content/uploads/2023/03/UV-Exposure-and-Heat-Illness-Guide.pdf',
      },
    ],
  },
  {
    title: 'Terms and conditions',
    paragraphs: [
      'This website provides general information for informational and educational purposes only about heat stress risk for people engaged in various sports at specific locations.',
      'The Heat and Health Research Centre at the University of Sydney created and provides this website, including evidence-based heat stress risk guidance.',
    ],
  },
  {
    title: 'Medical disclaimer',
    paragraphs: [
      'No medical advice is provided through this website. If you believe you or another person has a medical emergency, contact emergency services or a healthcare provider immediately.',
    ],
  },
  {
    title: 'Warranty and general disclaimer',
    paragraphs: [
      'To the maximum extent permitted by law, no warranties are made regarding completeness, accuracy, uninterrupted access, or fitness of website content.',
      'Access may be restricted, suspended, or terminated at any time without notice.',
    ],
  },
  {
    title: 'Privacy',
    paragraphs: [
      'No personal information is collected by default in this website phase.',
      'Selected sport and location preferences may be stored locally in your browser to improve usability.',
      'Anonymous usage statistics may be collected for service quality and research in line with University privacy policy expectations.',
    ],
    links: [
      {
        label: 'University of Sydney Privacy Policy',
        href: 'https://www.sydney.edu.au/about-us/governance-and-structure/policies/privacy.html',
      },
    ],
  },
  {
    title: 'Unacceptable activity',
    paragraphs: [
      'You must not use this website for unlawful, harmful, or disruptive activity.',
    ],
    bulletPoints: [
      'Breaching privacy or legal rights of others.',
      'Defaming or harassing individuals or organizations.',
      'Uploading malware, viruses, or malicious code.',
      'Posting unauthorized, offensive, or unlawful content.',
    ],
  },
]
