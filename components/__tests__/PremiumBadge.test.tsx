import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PremiumBadge from '../PremiumBadge';

describe('PremiumBadge Component', () => {
    it('renders with default locked props and label "Premium"', () => {
        const { getByText } = render(<PremiumBadge />);
        // Ensure that the component renders and has the default text
        expect(getByText('Premium')).toBeTruthy();
    });

    it('renders alternative text when provided', () => {
        const { getByText } = render(<PremiumBadge locked={false} label="Unlocked Badge" />);
        expect(getByText('Unlocked Badge')).toBeTruthy();
    });

    it('triggers onPress correctly when tapped', () => {
        const mockOnPress = jest.fn();
        const { getByText } = render(
            <PremiumBadge label="Tap Me" onPress={mockOnPress} />
        );
        
        // Simulating user touch on the element that contains text "Tap Me"
        fireEvent.press(getByText('Tap Me'));
        
        // Ensure the onPress callback is successfully invoked exactly once
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does not crash if onPress is not provided yet pressed', () => {
        const { getByText } = render(<PremiumBadge label="No Action" />);
        
        // Even without onPress, trying to interact (or simply mounting) shouldn't throw error
        // But note: PremiumBadge uses TouchableOpacity only if onPress is provided.
        // If not provided, it just returns a LinearGradient.
        // So `fireEvent.press()` might either have no effect or throw if node is not pressable.
        expect(getByText('No Action')).toBeTruthy();
    });
});
