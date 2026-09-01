const baseUrl = "http://localhost:3000/api/income-lab";

const opportunities = [
  {
    name: "FeetFinder",
    category: "Adult creator",
    status: "TESTING",
    description: "Sell foot-photo albums, custom content, and permitted physical items.",
    notes: "Profile and album concepts have already been developed.",
    nextAction: "Continue testing listings, pricing, and posting frequency.",
  },
  {
    name: "ShopMy",
    category: "Affiliate",
    status: "RESEARCHING",
    description: "Earn affiliate income through curated product recommendations.",
    nextAction: "Evaluate eligibility and build first collection.",
  },
  {
    name: "Amazon Storefront",
    category: "Affiliate",
    status: "RESEARCHING",
    description: "Monetize product recommendations through Amazon.",
    nextAction: "Check current eligibility requirements.",
  },
  {
    name: "Amazon Self-Published Books",
    category: "Digital products",
    status: "RESEARCHING",
    description: "Create and self-publish useful books through Amazon KDP.",
    nextAction: "Identify first low-complexity book concept.",
  },
  {
    name: "Amazon Planners",
    category: "Digital products",
    status: "RESEARCHING",
    description: "Create planner products for Amazon, potentially using automation tools during production.",
    notes: "Previously discussed using Replit as part of the workflow.",
    nextAction: "Choose a niche and validate demand.",
  },
  {
    name: "UGC for Brands",
    category: "UGC",
    status: "RESEARCHING",
    description: "Create paid user-generated video content for brands.",
    nextAction: "Build a starter portfolio and rate card.",
  },
  {
    name: "UGC YouTube",
    category: "UGC",
    status: "RESEARCHING",
    description: "Use YouTube as a channel for UGC-style monetized content.",
    nextAction: "Define format and monetization path.",
  },
  {
    name: "Higgsfield UGC",
    category: "AI / UGC",
    status: "RESEARCHING",
    description: "Explore AI-assisted UGC creation using Higgsfield.",
    nextAction: "Test a sample commercial-style video workflow.",
  },
  {
    name: "Cantina UGC",
    category: "AI / UGC",
    status: "RESEARCHING",
    description: "Explore UGC and creator income opportunities through Cantina.",
    nextAction: "Research current creator opportunities.",
  },
  {
    name: "TikTok Shop",
    category: "Social commerce",
    status: "RESEARCHING",
    description: "Generate revenue through TikTok Shop products and content.",
    nextAction: "Evaluate affiliate versus seller model.",
  },
  {
    name: "TikTok Shop Dropshipping",
    category: "E-commerce",
    status: "RESEARCHING",
    description: "Explore a TikTok Shop dropshipping model.",
    nextAction: "Evaluate margins, fulfillment, and platform rules.",
  },
  {
    name: "Pitch'em PR",
    category: "Freelance / PR",
    status: "RESEARCHING",
    description: "Potential PR-related side-income opportunity.",
    nextAction: "Research current platform model and realistic earnings.",
  },
  {
    name: "Professional Muse",
    category: "Creator",
    status: "RESEARCHING",
    description: "Potential creator or personality-based income opportunity.",
    nextAction: "Research platform requirements and earning model.",
  },
  {
    name: "Meete",
    category: "Creator / social",
    status: "RESEARCHING",
    description: "Potential income through the Meete app.",
    nextAction: "Evaluate payout structure, privacy, and time-to-income.",
  },
  {
    name: "Polsia Niche Business",
    category: "AI business",
    status: "RESEARCHING",
    description: "Explore using Polsia to build or operate a niche business.",
    nextAction: "Identify a niche worth testing.",
  },
  {
    name: "MadeThis",
    category: "Creator",
    status: "RESEARCHING",
    description: "Potential creator-side income platform previously identified for research.",
    nextAction: "Research current business model and payout potential.",
  },
  {
    name: "Scaled Creator",
    category: "Content distribution",
    status: "RESEARCHING",
    description: "Explore content repurposing, syndication, and creator-growth opportunities.",
    nextAction: "Evaluate whether it improves Rouke Ranch distribution enough to justify cost.",
  },
  {
    name: "Skill Creator Syndication",
    category: "Content distribution",
    status: "RESEARCHING",
    description: "Potential content syndication and creator monetization workflow.",
    nextAction: "Compare against Scaled Creator and Repurpose.io.",
  },
  {
    name: "Webcam Modeling",
    category: "Adult creator",
    status: "RESEARCHING",
    description: "Evaluate webcam modeling as a potential income stream.",
    nextAction: "Research privacy, platform economics, and boundaries before testing.",
  },
  {
    name: "Goddess / Financial Domination Content",
    category: "Adult creator",
    status: "RESEARCHING",
    description: "Potential persona-based adult creator income stream.",
    nextAction: "Evaluate privacy, platform rules, boundaries, and realistic earnings.",
  },
  {
    name: "Sell Underwear",
    category: "Adult creator",
    status: "RESEARCHING",
    description: "Potential income from permitted used-clothing marketplaces.",
    nextAction: "Research platform rules, privacy, pricing, and shipping.",
  },
  {
    name: "OddWallets",
    category: "Online income",
    status: "RESEARCHING",
    description: "Potential online side-income opportunity previously saved for research.",
    nextAction: "Verify legitimacy and earning model.",
  },
  {
    name: "Receipt Scanning Apps",
    category: "Cashback",
    status: "RESEARCHING",
    description: "Stack legitimate receipt-reward apps for ongoing small cash returns.",
    nextAction: "Choose the best apps and establish a repeatable scanning routine.",
  },
  {
    name: "Mistplay",
    category: "Micro earnings",
    status: "RESEARCHING",
    description: "Earn small rewards while playing mobile games.",
    nextAction: "Compare effective hourly return against other reward apps.",
  },
  {
    name: "Freecash",
    category: "Micro earnings",
    status: "RESEARCHING",
    description: "Earn small amounts through games, offers, and tasks.",
    nextAction: "Test only higher-value offers and track actual hourly return.",
  },
];

async function main() {
  const existingResponse = await fetch(baseUrl);

  if (!existingResponse.ok) {
    throw new Error(`Unable to read Income Lab: ${existingResponse.status}`);
  }

  const existingData = await existingResponse.json();
  const existingNames = new Set(
    (existingData.opportunities ?? []).map((item) =>
      item.name.trim().toLowerCase()
    )
  );

  let added = 0;
  let skipped = 0;

  for (const opportunity of opportunities) {
    if (existingNames.has(opportunity.name.toLowerCase())) {
      console.log(`SKIP: ${opportunity.name}`);
      skipped++;
      continue;
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(opportunity),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`FAILED: ${opportunity.name}`);
      console.error(error);
      continue;
    }

    console.log(`ADDED: ${opportunity.name}`);
    added++;
  }

  console.log("");
  console.log(`Finished. Added ${added}; skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
