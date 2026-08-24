import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from './button';

afterEach(cleanup);

describe('Button', () => {
	it('registers every rapid touch tap exactly once', () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Increase</Button>);
		const button = screen.getByRole('button', { name: 'Increase' });

		for (let pointerId = 1; pointerId <= 20; pointerId++) {
			fireEvent.pointerDown(button, { pointerId, pointerType: 'touch' });
			fireEvent.pointerUp(button, { pointerId, pointerType: 'touch' });
			fireEvent.click(button, { detail: 1 });
		}

		expect(onClick).toHaveBeenCalledTimes(20);
	});

	it('retains click activation for keyboard and mouse input', () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Increase</Button>);
		const button = screen.getByRole('button', { name: 'Increase' });

		fireEvent.click(button, { detail: 0 });
		fireEvent.pointerDown(button, { pointerType: 'mouse' });
		fireEvent.click(button, { detail: 1 });

		expect(onClick).toHaveBeenCalledTimes(2);
	});

	it('applies rapid touch activation to rendered elements', () => {
		const onClick = vi.fn();
		render(
			<Button render={<a href="#target" />} onClick={onClick}>
				Continue
			</Button>,
		);
		const link = screen.getByRole('link', { name: 'Continue' });

		fireEvent.pointerDown(link, { pointerId: 1, pointerType: 'touch' });
		fireEvent.pointerUp(link, { pointerId: 1, pointerType: 'touch' });
		fireEvent.click(link, { detail: 1 });

		expect(onClick).toHaveBeenCalledOnce();
	});
});
