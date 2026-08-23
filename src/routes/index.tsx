import * as stylex from '@stylexjs/stylex';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { styles } from '../app.styles';
import { useSession } from '../hooks/use-session';

function LaunchPage() {
	const { session, setSession, setUndo } = useSession();
	const [confirmingReset, setConfirmingReset] = useState(false);
	const navigate = useNavigate();
	const resume = () =>
		navigate({ to: session?.setupComplete ? '/play' : '/setup' });
	return (
		<main {...stylex.props(styles.app, styles.launch)}>
			<p {...stylex.props(styles.eyebrow)}>LOCAL-FIRST TABLE COMPANION</p>
			<h1 {...stylex.props(styles.heading)}>
				Mistborn
				<br />
				Player Aid
			</h1>
			<p {...stylex.props(styles.lede)}>
				A shared iPad aid for competitive play. Physical components always
				remain authoritative.
			</p>
			{session ? (
				<Card
					className={stylex.props(styles.appCard, styles.savedGame).className}
				>
					<strong>Saved game on this iPad</strong>
					<span>
						{session.players.map((player) => player.name).join(' · ')}
					</span>
					<Button size="lg" onClick={resume}>
						Resume game
					</Button>
					{confirmingReset ? (
						<div {...stylex.props(styles.confirm)}>
							<span>Delete this local game?</span>
							<Button
								variant="destructive"
								onClick={() => {
									setSession(null);
									setUndo([]);
								}}
							>
								Reset game
							</Button>
							<Button
								variant="outline"
								onClick={() => setConfirmingReset(false)}
							>
								Keep it
							</Button>
						</div>
					) : (
						<Button variant="ghost" onClick={() => setConfirmingReset(true)}>
							Reset saved game
						</Button>
					)}
				</Card>
			) : (
				<Button
					className={stylex.props(styles.launchAction).className}
					size="lg"
					render={<Link to="/setup" />}
				>
					New competitive game
				</Button>
			)}
			<p {...stylex.props(styles.finePrint)}>
				Saved information stays only on this iPad.
			</p>
		</main>
	);
}

export const Route = createFileRoute('/')({
	component: LaunchPage,
});
