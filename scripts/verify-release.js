import config from "../release-test.config.js";

const { runReleaseVerification } = await loadTestingPackage();

runReleaseVerification(config).catch((error) => {
  console.error(error);
  process.exit(1);
});

async function loadTestingPackage() {
  try {
    return import("file:///C:/Users/sjroy/Source/packages/workside-testing/index.js");
  } catch {
    return await import("@workside/testing");
  }
}
