export type ParsedTaskCapture = {
  intent: "TASK";
  title: string;
  areaSlug: string | null;
  priority: "NORMAL" | "HIGH";
  dueAt: string | null;
  needsContext: boolean;
};

export type ParsedIncomeLabCapture = {
  intent: "INCOME_LAB";
  title: string;
  needsContext: boolean;
};

export type ParsedCapture =
  | ParsedTaskCapture
  | ParsedIncomeLabCapture;

type ParseCaptureOptions = {
  contextText?: string | null;
};

const AREA_ALIASES: Array<{
  slug: string;
  names: string[];
}> = [
  {
    slug: "jarvis",
    names: ["jarvis"],
  },
  {
    slug: "finance",
    names: ["finance", "financial"],
  },
  {
    slug: "pepperdine",
    names: ["pepperdine", "grad school", "school"],
  },
  {
    slug: "social-media",
    names: [
      "social media",
      "social",
      "tiktok",
      "instagram",
      "facebook",
      "youtube",
      "pinterest",
    ],
  },
  {
    slug: "income-lab",
    names: ["income lab"],
  },
  {
    slug: "rouke-ranch",
    names: [
      "rouke ranch",
      "ranch",
      "property",
      "house",
      "home",
      "yard",
      "lawn",
      "mower",
    ],
  },
];

function cleanTitle(value: string) {
  return value
    .trim()
    .replace(/^[\s:,-]+/, "")
    .replace(/[\s.]+$/, "")
    .replace(/\s+/g, " ");
}

function resolveContextTitle(
  value: string,
  contextText?: string | null,
) {
  const cleaned = cleanTitle(value);

  if (
    /^(this|that|it|this item|that item)$/i.test(cleaned)
  ) {
    const context = cleanTitle(contextText ?? "");

    if (context) {
      return {
        title: context,
        needsContext: false,
      };
    }

    return {
      title: cleaned,
      needsContext: true,
    };
  }

  return {
    title: cleaned,
    needsContext: false,
  };
}

function explicitAreaFromText(text: string) {
  const lowered = text.toLowerCase();

  for (const area of AREA_ALIASES) {
    for (const name of area.names) {
      const patterns = [
        ` to ${name}`,
        ` in ${name}`,
        ` under ${name}`,
        ` for ${name}`,
      ];

      if (patterns.some((pattern) => lowered.endsWith(pattern))) {
        return area.slug;
      }
    }
  }

  return null;
}

function stripExplicitArea(text: string) {
  let result = text;

  for (const area of AREA_ALIASES) {
    for (const name of area.names) {
      const escaped = name.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

      result = result.replace(
        new RegExp(
          `\\s+(?:to|in|under|for)\\s+${escaped}\\s*$`,
          "i",
        ),
        "",
      );
    }
  }

  return cleanTitle(result);
}

function inferArea(text: string) {
  const lowered = text.toLowerCase();

  const keywordGroups: Array<{
    slug: string;
    keywords: string[];
  }> = [
    {
      slug: "jarvis",
      keywords: [
        "jarvis",
        "dashboard",
        "api",
        "prisma",
        "database",
        "sidebar",
      ],
    },
    {
      slug: "finance",
      keywords: [
        "bill",
        "mortgage",
        "credit card",
        "bank",
        "debt",
        "plaid",
        "rbfcu",
        "chase",
        "budget",
      ],
    },
    {
      slug: "pepperdine",
      keywords: [
        "pepperdine",
        "oled ",
        "assignment",
        "syllabus",
        "grad school",
        "coursework",
      ],
    },
    {
      slug: "social-media",
      keywords: [
        "tiktok",
        "instagram",
        "facebook",
        "youtube",
        "pinterest",
        "content",
        "caption",
        "video",
        "social media",
      ],
    },
    {
      slug: "rouke-ranch",
      keywords: [
        "mower",
        "lawn",
        "yard",
        "carpet",
        "house",
        "home",
        "property",
        "repair",
        "dog",
        "cat",
        "ranch",
      ],
    },
  ];

  for (const group of keywordGroups) {
    if (
      group.keywords.some((keyword) =>
        lowered.includes(keyword),
      )
    ) {
      return group.slug;
    }
  }

  return "jarvis";
}

function parseIncomeLab(
  text: string,
  options: ParseCaptureOptions,
): ParsedIncomeLabCapture | null {
  const patterns = [
    /^add\s+(.+?)\s+to\s+(?:the\s+)?income\s+lab$/i,
    /^put\s+(.+?)\s+in\s+(?:the\s+)?income\s+lab$/i,
    /^save\s+(.+?)\s+to\s+(?:the\s+)?income\s+lab$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) continue;

    const resolved = resolveContextTitle(
      match[1],
      options.contextText,
    );

    return {
      intent: "INCOME_LAB",
      title: resolved.title,
      needsContext: resolved.needsContext,
    };
  }

  return null;
}

function parseTask(
  text: string,
  options: ParseCaptureOptions,
): ParsedTaskCapture | null {
  const explicitArea = explicitAreaFromText(text);

  const patterns = [
    /^add\s+(.+?)\s+to\s+(?:jarvis|finance|financial|pepperdine|grad school|school|social media|social|tiktok|instagram|facebook|youtube|pinterest|rouke ranch|ranch|property|house|home|yard|lawn|mower)$/i,
    /^put\s+(.+?)\s+in\s+(?:jarvis|finance|financial|pepperdine|grad school|school|social media|social|tiktok|instagram|facebook|youtube|pinterest|rouke ranch|ranch|property|house|home|yard|lawn|mower)$/i,
    /^come\s+back\s+to\s+(.+?)\s+later$/i,
    /^come\s+back\s+to\s+(.+)$/i,
    /^remember\s+to\s+(.+)$/i,
    /^i\s+need\s+to\s+(.+)$/i,
    /^add\s+(.+?)\s+to\s+my\s+task(?:\s+list)?$/i,
    /^add\s+(.+?)\s+as\s+a\s+task$/i,
    /^task:\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) continue;

    let capturedText = stripExplicitArea(match[1]);

    // "Come back to replacing X later" reads more naturally
    // in the task list as "Replace X".
    capturedText = capturedText.replace(
      /^replacing\b/i,
      "Replace",
    );

    const resolved = resolveContextTitle(
      capturedText,
      options.contextText,
    );

    return {
      intent: "TASK",
      title: resolved.title,
      areaSlug:
        explicitArea ?? inferArea(resolved.title),
      priority: "NORMAL",
      dueAt: null,
      needsContext: resolved.needsContext,
    };
  }

  return null;
}

export function parseJarvisCapture(
  input: string,
  options: ParseCaptureOptions = {},
): ParsedCapture | null {
  const text = input.trim();

  if (!text) {
    return null;
  }

  const incomeLab = parseIncomeLab(text, options);

  if (incomeLab) {
    return incomeLab;
  }

  const task = parseTask(text, options);

  if (task) {
    return task;
  }

  return null;
}
