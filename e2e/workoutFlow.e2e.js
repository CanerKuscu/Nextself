describe('Core Critical Path', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should successfully login, start a workout, and complete it', async () => {
    // 1. Login
    await expect(element(by.id('email-input'))).toBeVisible();
    await element(by.id('email-input')).typeText('testuser@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('login-button')).tap();

    // Wait for Home Screen to load
    await expect(element(by.id('home-screen'))).toBeVisible();

    // 2. Navigate to Workouts
    await element(by.id('tab-Sports')).tap(); // Assuming 'Sports' or 'Workouts' tab
    await expect(element(by.id('workout-screen'))).toBeVisible();

    // 3. Start a Workout
    await element(by.id('start-workout-button')).atIndex(0).tap();
    await expect(element(by.id('active-workout-screen'))).toBeVisible();

    // 4. Complete the Workout
    // Simulate finishing exercises
    await element(by.id('finish-exercise-button')).tap();
    
    // Complete the entire workout
    await element(by.id('complete-workout-button')).tap();

    // Confirm completion
    await expect(element(by.text('Workout Completed!'))).toBeVisible();
    await element(by.text('OK')).tap();

    // Should return to Home or Workout list
    await expect(element(by.id('workout-screen'))).toBeVisible();
  });
});
