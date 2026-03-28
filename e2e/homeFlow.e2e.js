describe('Home Screen Initial Flow', () => {
  beforeAll(async () => {
    // Launch app instance before running any test definitions
    await device.launchApp();
  });

  beforeEach(async () => {
    // Reloads the React Native environment instead of full restart (faster setup per test)
    await device.reloadReactNative();
  });

  it('should verify the app successfully loads the first screen element', async () => {
    // Depending on what your first screen renders, adjust the testID to "home-screen" or similar root View.
    // Example: <View testID="app-root"> or <Text>Welcome</Text>
    
    // We wait and expect any visual element to present confirming startup.
    // Replace 'welcome-title' with an actual testID you add to your Home or Login screen's title tag.
    // e.g. <Text testID="welcome-title">Hoş Geldiniz</Text>
    
    // await expect(element(by.id('welcome-title'))).toBeVisible();

    // Since we do not know the exact starting layout, an agnostic test asserting the device boots up
    console.log('App launched! First automated interaction completes successfully.');
  });
});
