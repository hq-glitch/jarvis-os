const baseUrl = "http://localhost:3000/api/projects";

const projects = [
  {
    name: "Jarvis OS",
    description: "Build and improve the personal AI operating system.",
    status: "ACTIVE",
    progress: 40,
    nextAction: "Continue building core Jarvis modules.",
  },
  {
    name: "Pepperdine",
    description: "Manage coursework, readings, deadlines, research, and doctoral work.",
    status: "ACTIVE",
    progress: 20,
    nextAction: "Keep academic deadlines and coursework organized.",
  },
  {
    name: "Rouke Ranch",
    description: "Manage the physical property, land, maintenance, repairs, equipment, and improvements.",
    status: "ACTIVE",
    progress: 0,
    nextAction: "Capture current property maintenance and improvement projects.",
  },
  {
    name: "Finance",
    description: "Track debt, accounts, bills, taxes, and major financial decisions.",
    status: "ACTIVE",
    progress: 15,
    nextAction: "Continue improving the finance dashboard.",
  },
];

async function main() {
  const existingResponse = await fetch(baseUrl);

  if (!existingResponse.ok) {
    throw new Error(`Unable to read projects: ${existingResponse.status}`);
  }

  const existingData = await existingResponse.json();
  const existingNames = new Set(
    (existingData.projects ?? []).map((item) =>
      item.name.trim().toLowerCase()
    )
  );

  for (const project of projects) {
    if (existingNames.has(project.name.toLowerCase())) {
      console.log(`SKIP: ${project.name}`);
      continue;
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      console.error(`FAILED: ${project.name}`);
      continue;
    }

    console.log(`ADDED: ${project.name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
