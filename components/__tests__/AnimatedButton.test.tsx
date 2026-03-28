import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import AnimatedButton from '../AnimatedButton';
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('AnimatedButton', () => {
    const renderWithProvider = (ui: React.ReactElement) =>
        render(<ThemeProvider>{ui}</ThemeProvider>);

    it('renders correctly with title', () => {
        const { getByText } = renderWithProvider(
            <AnimatedButton title="Test Button" onPress={() => { }} />
        );
        expect(getByText('Test Button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const onPressMock = jest.fn();
        const { getByText } = renderWithProvider(
            <AnimatedButton title="Press Me" onPress={onPressMock} />
        );
        fireEvent.press(getByText('Press Me'));
        expect(onPressMock).toHaveBeenCalled();
    });

    it('is disabled when disabled prop is true', () => {
        const onPressMock = jest.fn();
        const { getByText } = renderWithProvider(
            <AnimatedButton title="Disabled" onPress={onPressMock} disabled />
        );
        fireEvent.press(getByText('Disabled'));
        expect(onPressMock).not.toHaveBeenCalled();
    });
});
