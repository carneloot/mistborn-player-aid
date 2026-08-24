'use client';

import { useRender } from '@base-ui/react';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';

import { customClassName } from '@/lib/utils.stylex';

import { colors, radius } from '../../lib/tokens.stylex';

const styles = stylex.create({
	base: {
		alignItems: 'center',
		borderRadius: radius.md,
		borderStyle: 'solid',
		borderWidth: 0,
		cursor: { ':disabled': 'not-allowed', default: 'pointer' },
		display: 'inline-flex',
		flexShrink: 0,
		fontSize: '0.9375rem',
		fontWeight: 700,
		gap: '0.5rem',
		justifyContent: 'center',
		opacity: { ':disabled': 0.5, default: 1 },
		outline: 'none',
		pointerEvents: { ':disabled': 'none', default: null },
		transition:
			'color 0.15s, background-color 0.15s, box-shadow 0.15s, border-color 0.15s',
		touchAction: 'manipulation',
		whiteSpace: 'nowrap',
	},
	default: {
		backgroundColor: colors.primary,
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		color: colors.primaryForeground,
	},
	destructive: {
		backgroundColor: colors.destructive,
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		color: colors.primaryForeground,
	},
	focusable: {
		boxShadow: {
			':focus-visible': `0 0 0 3px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
			default: null,
		},
	},
	ghost: {
		backgroundColor: 'transparent',
		color: colors.foreground,
	},
	link: {
		backgroundColor: 'transparent',
		color: colors.primary,
		textDecorationLine: 'none',
		textUnderlineOffset: '4px',
	},
	outline: {
		backgroundColor: colors.background,
		borderColor: colors.border,
		borderWidth: '1px',
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		color: colors.foreground,
	},
	secondary: {
		backgroundColor: colors.secondary,
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		color: colors.secondaryForeground,
	},
	sizeDefault: { height: '2.75rem', paddingInline: '1rem' },
	sizeIcon: { height: '2.75rem', paddingInline: 0, width: '2.75rem' },
	sizeIconLg: { height: '2.75rem', paddingInline: 0, width: '2.75rem' },
	sizeIconSm: { height: '2rem', paddingInline: 0, width: '2rem' },
	sizeLg: { height: '3.125rem', paddingInline: '2rem' },
	sizeSm: { height: '2rem', paddingInline: '0.75rem' },
});

type ButtonVariant =
	| 'default'
	| 'destructive'
	| 'outline'
	| 'secondary'
	| 'ghost'
	| 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

const variantStyles: Record<ButtonVariant, StyleXStyles> = {
	default: styles.default,
	destructive: styles.destructive,
	ghost: styles.ghost,
	link: styles.link,
	outline: styles.outline,
	secondary: styles.secondary,
};

const sizeStyles: Record<ButtonSize, StyleXStyles> = {
	default: styles.sizeDefault,
	icon: styles.sizeIcon,
	'icon-lg': styles.sizeIconLg,
	'icon-sm': styles.sizeIconSm,
	lg: styles.sizeLg,
	sm: styles.sizeSm,
};

export interface ButtonProps extends Omit<
	React.ComponentProps<'button'>,
	'className'
> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
	/** Render as a different element (Base UI render API). */
	render?: useRender.RenderProp;
}

const Button = ({
	className,
	style,
	variant = 'default',
	size = 'default',
	render,
	type = 'button',
	...props
}: ButtonProps) =>
	useRender({
		props: {
			...stylex.props(
				styles.base,
				styles.focusable,
				variantStyles[variant],
				sizeStyles[size],
				customClassName(className),
				style as StyleXStyles,
			),
			'data-size': size,
			'data-slot': 'button',
			'data-variant': variant,
			type,
			...props,
		},
		render: render ?? <button />,
	});

export { Button, styles as buttonStyles };
