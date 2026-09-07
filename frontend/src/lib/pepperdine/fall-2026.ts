export type PepperdineCourse = {
  code: string;
  title: string;
  units: number;
  instructors: string[];
  meetingSummary: string;
  gradingSummary: string;
  latePolicy: string;
  aiPolicy: string;
  requiredBooks: string[];
};

export const fall2026Courses: PepperdineCourse[] = [
  {
    code: "OLED 700",
    title: "Leadership Theory and Practice",
    units: 3,
    instructors: [
      "Dr. Farzin Madjidi",
      "Dr. Amanda Wickramasinghe",
    ],
    meetingSummary:
      "Zoom Thursdays, 6:00–8:30 PM PT in Weeks 4, 7, 10, 13, and 14. In-person intensive September 23–24.",
    gradingSummary:
      "Final Project 45% • Class Preparation and Engagement 15% • Leadership Theory Presentation 15% • Leadership Challenge Paper 25%",
    latePolicy:
      "Assignments should be submitted by the deadline. Contact the faculty team if an extension is needed.",
    aiPolicy:
      "AI is allowed for brainstorming and outlining/generating ideas. Follow assignment-specific AI policies in Digital Campus.",
    requiredBooks: [
      "Brown (2018), Dare to Lead",
      "Kotter & Rathgeber (2017), Our Iceberg Is Melting",
      "Northouse (2019), Leadership: Theory and Practice",
      "Rath (2007), StrengthsFinder 2.0",
      "Sinek (2017), Leaders Eat Last",
    ],
  },
  {
    code: "OLED 724",
    title:
      "Ethical Leadership, Equity, Cultural Proficiency, and Social Justice",
    units: 3,
    instructors: ["Dr. Gabriella Miramontes"],
    meetingSummary:
      "Zoom Wednesdays, 6:00–8:30 PM PT in Weeks 4, 6, 9, 13, and 15. In-person intensive September 26–27.",
    gradingSummary:
      "Credit/No Credit. Minimum cumulative score of 83% required for credit.",
    latePolicy:
      "Assignments may be submitted up to 7 calendar days late without penalty. After that window, assignments receive zero unless covered by an approved university accommodation or policy.",
    aiPolicy:
      "Generative AI may be used unless an assignment limits or prohibits it, but all use must be disclosed and documented, including tools, purpose, prompts, relevant outputs, and how the material was evaluated or incorporated.",
    requiredBooks: [
      "Johnson (2024), Meeting the Ethical Challenges of Leadership",
      "Sensoy & DiAngelo (2017), Is Everyone Really Equal?",
      "Singleton (2021), Courageous Conversations About Race",
    ],
  },
  {
    code: "OLED 766",
    title: "Introduction to Research Design and Methodology",
    units: 3,
    instructors: ["Dr. Seung Lee"],
    meetingSummary:
      "Zoom Wednesdays, 6:00–8:30 PM PT in Weeks 2, 5, 8, 11, and 14. In-person intensive September 25.",
    gradingSummary:
      "Research Reflections 12 points • Research Pods 12 points • Assignments 60 points • Padlets 6 points • Participation 10 points",
    latePolicy:
      "Assignments submitted up to 4 days late are accepted with a 25% penalty. More than 4 days late is not accepted unless an extension is granted for extenuating circumstances.",
    aiPolicy:
      "Limited AI use is permitted for idea generation, synthesis, and information gathering. AI output must be fact-checked, and students are expected to complete writing assignments themselves.",
    requiredBooks: [
      "Bhattacherjee (2012), Social Science Research",
      "Creswell & Creswell (2022), Research Design",
    ],
  },
];

export const fall2026Summary = {
  term: "Fall 2026",
  courseCount: fall2026Courses.length,
  units: fall2026Courses.reduce((total, course) => total + course.units, 0),
  expectedWeeklyHours: 27,
  immersionDates: "September 23–27, 2026",
};

export type PepperdineWeekItem = {
  course: string;
  type: "assignment" | "reading" | "meeting";
  title: string;
  dueDay?: string;
  dueDate?: string;
  priority?: "high" | "normal";
  readingDetail?: string;
};

export type PepperdineWeek = {
  week: number;
  startDate: string;
  endDate: string;
  items: PepperdineWeekItem[];
};

export const fall2026Weeks: PepperdineWeek[] = [
  {
    week: 1,
    startDate: "2026-09-08",
    endDate: "2026-09-14",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "CITI Program Certificate IRB",
        dueDay: "Friday",
        dueDate: "2026-09-11",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "APA 7th Edition Mastery Assessment",
        dueDay: "Sunday",
        dueDate: "2026-09-13",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Goleman (1998), Northouse (2019), PopTech (2014), TEDx/TEDx Talks, and Valuetainment resources",
      },
      {
        course: "OLED 724",
        type: "reading",
        title:
          "Johnson (2024), Latunde (2022), and Sensoy & DiAngelo (2017)",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Bhattacherjee (2012)",
      },
    ],
  },

  {
    week: 2,
    startDate: "2026-09-15",
    endDate: "2026-09-21",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Individual Research Team Formation Questionnaire",
        dueDay: "Friday",
        dueDate: "2026-09-18",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Lollipop Moments and Everyday Leadership",
        dueDay: "Friday",
        dueDate: "2026-09-18",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Leadership Trait Questionnaire (LTQ) Reflection and Analysis",
        dueDay: "Sunday",
        dueDate: "2026-09-20",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Collins & Porras (1996), Eisenhardt et al. (1997), Heifetz & Laurie (2001), Northouse (2019), Porath & Pearson (2013), Rooke & Torbert (2005), Matrix Video (2010), Simon Sinek (2024), and The Aspen Institute (2013)",
      },
      {
        course: "OLED 724",
        type: "assignment",
        title: 'Your "Hall of Fame" Speech, Part 1',
        dueDay: "Friday",
        dueDate: "2026-09-18",
        priority: "high",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Sensoy & DiAngelo (2017) and Singleton (2021)",
      },
      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Pod Conversation #1: Sharing Topics of Interest",
        dueDay: "Sunday",
        dueDate: "2026-09-20",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022)",
      },
      {
        course: "OLED 766",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-09-16",
      },
    ],
  },

  {
    week: 3,
    startDate: "2026-09-22",
    endDate: "2026-09-28",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Research Team Collaboration Charter",
        dueDay: "Friday",
        dueDate: "2026-09-25",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Final Paper Topic and Approval",
        dueDay: "Sunday",
        dueDate: "2026-09-27",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Buckingham (2005), Goleman (2000), Heifetz & Laurie (2001), Northouse (2019), Rath (2007), Spreier et al. (2006), Thomas (2008), Zaleznik (2004), and assigned TED/TEDx resources",
      },
      {
        course: "OLED 700",
        type: "meeting",
        title: "In-person intensive — 4:00–6:00 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-09-23",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "meeting",
        title: "In-person intensive — 8:00 AM–6:30 PM PT",
        dueDay: "Thursday",
        dueDate: "2026-09-24",
        priority: "high",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title: 'Your "Hall of Fame" Speech, Part 2',
        dueDay: "Wednesday",
        dueDate: "2026-09-23",
        priority: "high",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Sensoy & DiAngelo (2017)",
      },
      {
        course: "OLED 724",
        type: "meeting",
        title: "In-person intensive — 9:00 AM–4:00 PM PT",
        dueDay: "Saturday",
        dueDate: "2026-09-26",
        priority: "high",
      },
      {
        course: "OLED 724",
        type: "meeting",
        title: "In-person intensive — 9:00 AM–1:00 PM PT",
        dueDay: "Sunday",
        dueDate: "2026-09-27",
        priority: "high",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Reflection #1: Finding Literature",
        dueDay: "Sunday",
        dueDate: "2026-09-27",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022)",
      },
      {
        course: "OLED 766",
        type: "meeting",
        title: "In-person intensive — 8:00 AM–6:30 PM PT",
        dueDay: "Friday",
        dueDate: "2026-09-25",
        priority: "high",
      },
    ],
  },

  {
    week: 4,
    startDate: "2026-09-29",
    endDate: "2026-10-05",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Literature Review and Sampling Plan",
        dueDay: "Sunday",
        dueDate: "2026-10-04",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Effelsberg et al. (2013), Martin & Epitropaki (2001), Northouse (2019), Stone et al. (2004), Tang et al. (2024), and assigned video resources",
      },
      {
        course: "OLED 700",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Thursday",
        dueDate: "2026-10-01",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title: "Leadership Development Plan",
        dueDay: "Sunday",
        dueDate: "2026-10-04",
        priority: "high",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Singleton (2021)",
      },
      {
        course: "OLED 724",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-09-30",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Annotated Bibliography",
        dueDay: "Sunday",
        dueDate: "2026-10-04",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022)",
      },
    ],
  },

  {
    week: 5,
    startDate: "2026-10-06",
    endDate: "2026-10-12",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Leadership Theory in Practice Presentation",
        dueDay: "Friday",
        dueDate: "2026-10-09",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Leadership Theory in Practice Presentation — Reply Posts",
        dueDay: "Sunday",
        dueDate: "2026-10-11",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title:
          "Theory Alignment Memo and Annotated Source List — verify due date in Digital Campus",
        priority: "normal",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Correlli (2021), Jiwen Song et al. (2024), Khan et al. (2023), Northouse (2019), Van Dyke & Hurt (2024), Washington et al. (2014), and assigned video resources",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title:
          "Journal: Decide, Influence, Act — Reflecting on Ethical Leadership Under Pressure",
        dueDay: "Sunday",
        dueDate: "2026-10-11",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Sensoy & DiAngelo (2017)",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Pod Conversation #2: Narrowing Our Research Focus",
        dueDay: "Sunday",
        dueDate: "2026-10-11",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022)",
      },
      {
        course: "OLED 766",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-10-07",
      },
    ],
  },

  {
    week: 6,
    startDate: "2026-10-13",
    endDate: "2026-10-19",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title:
          "Leadership Dialogue: Comparing Transformational vs. Servant Leadership in Crisis",
        dueDay: "Sunday",
        dueDate: "2026-10-18",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Informed Consent Documentation",
        dueDay: "Sunday",
        dueDate: "2026-10-18",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Alibašić (2024), Morris (2016), Northouse (2019), Savick (2022), How to Dialogue (2021), Kansas Leadership Center (2020), and assigned TEDx resource",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title: "The Digital Resume Audit & Influence Architecture — Initial Post",
        dueDay: "Thursday",
        dueDate: "2026-10-15",
      },
      {
        course: "OLED 724",
        type: "assignment",
        title: "The Digital Resume Audit & Influence Architecture — Reply Post",
        dueDay: "Sunday",
        dueDate: "2026-10-18",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Ethics Unwrapped and Johnson (2024)",
      },
      {
        course: "OLED 724",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-10-14",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Reflection #2: Purpose Statement & RQs",
        dueDay: "Sunday",
        dueDate: "2026-10-18",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022)",
      },
    ],
  },

  {
    week: 7,
    startDate: "2026-10-20",
    endDate: "2026-10-26",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Leadership Dialogue: Inclusive Leadership vs. Being an Inclusive Leader",
        dueDay: "Sunday",
        dueDate: "2026-10-25",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Literature Synthesis",
        dueDay: "Sunday",
        dueDate: "2026-10-25",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Banham (2018), Connor (2000), Hauret & Williams (2020), Jones (2019), Northouse (2019), Rivera (2014), Smith (2022), Tavakoli (2017), and assigned TED/TEDx resources",
      },
      {
        course: "OLED 700",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Thursday",
        dueDate: "2026-10-22",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title: "Journal: Epistemic Friction, Critical Equity, and Ethical Alignment",
        dueDay: "Sunday",
        dueDate: "2026-10-25",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Singleton (2021)",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Study Introduction",
        dueDay: "Sunday",
        dueDate: "2026-10-25",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Spickard (2017)",
      },
    ],
  },

  {
    week: 8,
    startDate: "2026-10-27",
    endDate: "2026-11-02",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Leadership Dialogue: Facilitating a Group Conversation on Gendered Leadership",
        dueDay: "Sunday",
        dueDate: "2026-11-01",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Crenshaw (1991), Eagly & Carli (2007), Hewlett & Buck Luce (2005), Rosener (1990), Ruderman & Ohlott (2004), and assigned TED/TEDx resources",
      },

      {
        course: "OLED 724",
        type: "reading",
        title: "School Improvement Network (2013) and Singleton (2021)",
      },

      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022) and Twining et al. (2017)",
      },
      {
        course: "OLED 766",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-10-28",
      },
    ],
  },

  {
    week: 9,
    startDate: "2026-11-03",
    endDate: "2026-11-09",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Interviews Conducted and Codebook",
        dueDay: "Sunday",
        dueDate: "2026-11-08",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Literature Findings Matrix",
        dueDay: "Sunday",
        dueDate: "2026-11-08",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Ahmad & Saidalavi (2019), Bonsu & Twum-Danso (2018), Chandwani et al. (2015), Davis (2018), Findler et al. (2007), Kayworth & Leidner (2002), Maranga (2018), Mathews (2016), Reiche et al. (2017), and assigned video resources",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title: "Journal: Ethical Leadership Requires More Than Good Intentions",
        dueDay: "Sunday",
        dueDate: "2026-11-08",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Singleton (2021)",
      },
      {
        course: "OLED 724",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-11-04",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Pod Conversation #3: Research Ethics",
        dueDay: "Sunday",
        dueDate: "2026-11-08",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022) and López et al. (2015)",
      },
    ],
  },

  {
    week: 10,
    startDate: "2026-11-10",
    endDate: "2026-11-16",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Leadership Interview Project Poster Draft",
        dueDay: "Sunday",
        dueDate: "2026-11-15",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Garvin & Roberto (2005), Heifetz & Linsky (2002), Kim & Mauborgne (2003), Kotter (1995), Kotter & Rathgeber (2017), Northouse (2019), Senge/Heifetz/Torbert (2000), Tager (2004), and assigned resources",
      },
      {
        course: "OLED 700",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Thursday",
        dueDate: "2026-11-12",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title: "The AI Quadrant Lab Practicum",
        dueDay: "Sunday",
        dueDate: "2026-11-15",
        priority: "high",
      },
      {
        course: "OLED 724",
        type: "reading",
        title: "Sensoy & DiAngelo (2017) and Singleton (2021)",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Reflection #3: Research Methods",
        dueDay: "Sunday",
        dueDate: "2026-11-15",
      },
      {
        course: "OLED 766",
        type: "assignment",
        title: "Individual Consultation — Weeks 10–11",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Creswell & Creswell (2022)",
      },
    ],
  },

  {
    week: 11,
    startDate: "2026-11-17",
    endDate: "2026-11-23",
    items: [
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Bourke & Dillon (2016), Coutu (2002), and assigned video/TEDx resources",
      },

      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Sensoy & DiAngelo (2017)",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Individual Consultation — Weeks 10–11",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Nishishiba, Jones & Kraner (2014)",
      },
      {
        course: "OLED 766",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-11-18",
      },
    ],
  },

  {
    week: 12,
    startDate: "2026-11-24",
    endDate: "2026-11-30",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "Leadership Challenge Paper",
        dueDay: "Friday",
        dueDate: "2026-11-27",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "reading",
        title: "Blanchard (2006) and assigned TEDx resources",
      },

      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Singleton (2021)",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Multi-Design Research Prospectus",
        dueDay: "Sunday",
        dueDate: "2026-11-29",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Przeworski & Salomon (1995)",
      },
    ],
  },

  {
    week: 13,
    startDate: "2026-12-01",
    endDate: "2026-12-07",
    items: [
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Brown (2018), Dhiman (2011), George et al. (2007), May et al. (2003), and assigned TED/TEDx resources",
      },
      {
        course: "OLED 700",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Thursday",
        dueDate: "2026-12-03",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title:
          "Strategic Consulting RFP: Navigating Systemic Equity Crisis & Institutional Power",
        dueDay: "Sunday",
        dueDate: "2026-12-06",
        priority: "high",
      },
      {
        course: "OLED 724",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-12-02",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Padlet Activity #1: Assessing a Qualitative Journal Article",
        dueDay: "Sunday",
        dueDate: "2026-12-06",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Select one qualitative article from the curated list",
      },
    ],
  },

  {
    week: 14,
    startDate: "2026-12-08",
    endDate: "2026-12-14",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "AI Use and Revision Log",
        dueDay: "Sunday",
        dueDate: "2026-12-13",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Cashman (2017), Dolezalek (2006), Grandy & Sliwa (2017), Horan (2020), Kouzes (2009), Kouzes & Posner (1990), Maccoby (2000), Sinek (2017), Soren (2015), and assigned TED/TEDx/Sinek resources",
      },
      {
        course: "OLED 700",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Thursday",
        dueDate: "2026-12-10",
      },

      {
        course: "OLED 724",
        type: "reading",
        title: "Johnson (2024) and Singleton (2021)",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Prospectus Presentation",
        dueDay: "Sunday",
        dueDate: "2026-12-13",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "assignment",
        title: "Padlet Activity #2: Assessing a Quantitative Journal Article",
        dueDay: "Sunday",
        dueDate: "2026-12-13",
      },
      {
        course: "OLED 766",
        type: "reading",
        title: "Select one quantitative article from the curated list",
      },
      {
        course: "OLED 766",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-12-09",
      },
    ],
  },

  {
    week: 15,
    startDate: "2026-12-15",
    endDate: "2026-12-21",
    items: [
      {
        course: "OLED 700",
        type: "assignment",
        title: "GSEP Community Event Reflection",
        dueDay: "Thursday",
        dueDate: "2026-12-17",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Final Project Paper",
        dueDay: "Friday",
        dueDate: "2026-12-18",
        priority: "high",
      },
      {
        course: "OLED 700",
        type: "assignment",
        title: "Peer Review of the Leadership Interview Project",
        dueDay: "Friday",
        dueDate: "2026-12-18",
      },
      {
        course: "OLED 700",
        type: "reading",
        title:
          "Blanchard & Stoner (2004), Campbell et al. (2009), Cialdini (2001), Druskat & Wolff (2001), Goleman et al. (2001), Guttman (2004), Snowden & Boone (2007), and assigned video/TED resources",
      },

      {
        course: "OLED 724",
        type: "assignment",
        title: "Personal Ethical Leadership Framework & Evidence-Based Audit",
        dueDay: "Friday",
        dueDate: "2026-12-18",
        priority: "high",
      },
      {
        course: "OLED 724",
        type: "assignment",
        title: "Live Session and Intensive Weekend Participation",
      },
      {
        course: "OLED 724",
        type: "meeting",
        title: "Live Zoom session — 6:00–8:30 PM PT",
        dueDay: "Wednesday",
        dueDate: "2026-12-16",
      },

      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Pod Conversation #4: Research Proposal Presentations",
        dueDay: "Friday",
        dueDate: "2026-12-18",
        priority: "high",
      },
      {
        course: "OLED 766",
        type: "assignment",
        title: "Research Reflection #4: Post-Presentation Reflection",
        dueDay: "Friday",
        dueDate: "2026-12-18",
      },
      {
        course: "OLED 766",
        type: "assignment",
        title: "Summative Live Session Participation and Engagement",
      },
    ],
  },
];

export function getPepperdineWeek(date = new Date()) {
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const currentWeek = fall2026Weeks.find((week) => {
    const start = new Date(`${week.startDate}T00:00:00`);
    const end = new Date(`${week.endDate}T23:59:59`);

    return localDate >= start && localDate <= end;
  });

  if (currentWeek) {
    return currentWeek;
  }

  const firstWeek = fall2026Weeks[0];

  if (firstWeek) {
    const firstStart = new Date(`${firstWeek.startDate}T00:00:00`);
    const previewStart = new Date(firstStart);
    previewStart.setDate(previewStart.getDate() - 1);

    if (localDate >= previewStart && localDate < firstStart) {
      return firstWeek;
    }
  }

  return null;
}
