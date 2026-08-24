import * as stylex from '@stylexjs/stylex';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { styles } from '../app.styles';
import { lightTheme } from '../lib/tokens.stylex';

const themeStorageKey = 'mistborn-player-aid-theme';
type Theme = 'dark' | 'light' | 'system';

type ThemeContextValue = {
	cycleTheme: () => void;
	theme: Theme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const initialTheme = (): Theme => {
	const savedTheme = localStorage.getItem(themeStorageKey);
	if (
		savedTheme === 'dark' ||
		savedTheme === 'light' ||
		savedTheme === 'system'
	)
		return savedTheme;
	return 'system';
};

const resolveTheme = (theme: Theme): 'dark' | 'light' =>
	theme === 'system'
		? window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light'
		: theme;

export function ThemeToggle() {
	const context = useContext(ThemeContext);
	if (!context)
		throw new Error('ThemeToggle must be rendered within RootLayout.');
	const nextTheme: Record<Theme, Theme> = {
		dark: 'system',
		light: 'dark',
		system: 'light',
	};
	const Icon =
		context.theme === 'light'
			? SunIcon
			: context.theme === 'dark'
				? MoonIcon
				: MonitorIcon;
	return (
		<Button
			className={stylex.props(styles.themeToggle).className}
			aria-label={`Theme: ${context.theme}. Switch to ${nextTheme[context.theme]}.`}
			onClick={context.cycleTheme}
			variant="ghost"
		>
			<Icon aria-hidden="true" {...stylex.props(styles.themeToggleIcon)} />
			{context.theme}
		</Button>
	);
}

function RootLayout() {
	const [theme, setTheme] = useState<Theme>(initialTheme);
	const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme));
	useEffect(() => {
		const viewport = window.visualViewport;
		if (!viewport) return;
		const updateViewportHeight = () =>
			document.documentElement.style.setProperty(
				'--app-viewport-height',
				`${viewport.height}px`,
			);
		updateViewportHeight();
		viewport.addEventListener('resize', updateViewportHeight);
		return () => viewport.removeEventListener('resize', updateViewportHeight);
	}, []);
	useEffect(() => {
		localStorage.setItem(themeStorageKey, theme);
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const updateResolvedTheme = () => setResolvedTheme(resolveTheme(theme));
		updateResolvedTheme();
		if (theme === 'system')
			media.addEventListener('change', updateResolvedTheme);
		return () => media.removeEventListener('change', updateResolvedTheme);
	}, [theme]);
	useEffect(() => {
		document.documentElement.style.colorScheme = resolvedTheme;
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute(
				'content',
				resolvedTheme === 'dark' ? '#151815' : '#f7f5ed',
			);
	}, [resolvedTheme]);
	const isLight = resolvedTheme === 'light';
	return (
		<div {...stylex.props(styles.root, isLight && lightTheme)}>
			<ThemeContext.Provider
				value={{
					cycleTheme: () =>
						setTheme((current) =>
							current === 'system'
								? 'light'
								: current === 'light'
									? 'dark'
									: 'system',
						),
					theme,
				}}
			>
				<Outlet />
			</ThemeContext.Provider>
		</div>
	);
}

export const Route = createRootRoute({
	component: RootLayout,
});
