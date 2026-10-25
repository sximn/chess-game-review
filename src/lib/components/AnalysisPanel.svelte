<script lang="ts">
	import { Tabs } from 'bits-ui';
	import type { Move } from 'chess.js';
	import { ArrowRight, BookOpen, ChartNoAxesCombined, Lightbulb, Sparkles } from 'lucide-svelte';
	import { demoAnalysis, demoEvaluations, moveLabel, type Timeline } from '#lib/chess.js';
	import EvaluationTimeline from './EvaluationTimeline.svelte';
	import AnimatedAccuracy from './AnimatedAccuracy.svelte';
	let {
		timeline,
		demo,
		ply,
		activeTab = $bindable('overview'),
		onNavigate
	}: {
		timeline: Timeline;
		demo: boolean;
		ply: number;
		activeTab?: string;
		onNavigate: (ply: number) => void;
	} = $props();
	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');
	let result = $derived(timeline.headers.Result || '*');
	let classification = $derived(
		demo ? demoAnalysis.find((item) => item.plies.includes(ply)) : undefined
	);
	let movePairs = $derived.by(() => {
		const pairs = new Map<
			number,
			{ number: number; white?: Move; black?: Move; whitePly: number; blackPly: number }
		>();
		timeline.moves.forEach((move, index) => {
			const number = Number(move.before.split(' ')[5]);
			const pair = pairs.get(number) ?? { number, whitePly: 0, blackPly: 0 };
			if (move.color === 'w') {
				pair.white = move;
				pair.whitePly = index + 1;
			} else {
				pair.black = move;
				pair.blackPly = index + 1;
			}
			pairs.set(number, pair);
		});
		return [...pairs.values()];
	});
	function go(value: number) {
		onNavigate(value);
	}
	function nextMoment() {
		go([19, 25, 29, 31, 33].find((value) => value > ply) ?? 19);
	}
</script>

<Tabs.Root bind:value={activeTab} class="review-tabs">
	<Tabs.List
		class="review-tab-list"
		aria-label="Review panels"
		style={`--active-tab:${['overview', 'moves', 'evaluation'].indexOf(activeTab)}`}
		><span class="review-tab-indicator" aria-hidden="true"></span><Tabs.Trigger value="overview"
			><Sparkles size={15} /> Overview</Tabs.Trigger
		><Tabs.Trigger value="moves"><BookOpen size={15} /> Moves</Tabs.Trigger><Tabs.Trigger
			value="evaluation"><ChartNoAxesCombined size={15} /> Evaluation</Tabs.Trigger
		></Tabs.List
	>
	<Tabs.Content value="overview" class="overview-content">
		{#if demo}
			<div class="recap-intro">
				<span class="mini-eyebrow">THE BIG PICTURE</span>
				<h2>Beautifully played.</h2>
				<p>Active pieces. A brave sacrifice.<br />A finish worth remembering.</p>
			</div>
			<AnimatedAccuracy whiteName={white} blackName={black} />
			<div class="quality-table">
				<div class="quality-table-head">
					<span>MOVE QUALITY</span><span
						><span class="color-dot white-dot"></span><span class="color-dot black-dot"
						></span></span
					>
				</div>
				{#each demoAnalysis as quality}<button
						class="quality-row"
						onclick={() => {
							go(quality.plies[0]);
						}}
						><span class="quality-icon" style={`--quality-color:${quality.color}`}
							>{quality.symbol}</span
						><span>{quality.name}</span><b>{quality.white}</b><b>{quality.black}</b></button
					>{/each}
			</div>
			<div class="sample-label"><span></span> Sample review · Illustrative analysis</div>
		{:else}
			<div class="imported-recap">
				<div class="empty-symbol"><BookOpen size={30} /></div>
				<span class="mini-eyebrow">YOUR GAME, AT YOUR PACE</span>
				<h2>A fresh perspective.</h2>
				<p>
					Your game is ready. Explore all {timeline.moves.length} half-moves, revisit a position, and
					keep your thoughts close.
				</p>
				<div class="import-stats">
					<div><strong>{Math.ceil(timeline.moves.length / 2)}</strong><span>Moves</span></div>
					<div><strong>{result === '*' ? '—' : result}</strong><span>Result</span></div>
				</div>
				<p class="sample-notice">
					Engine analysis is not connected yet. Accuracy and move classifications are only available
					in the sample review.
				</p>
				<button class="button secondary full" onclick={() => (activeTab = 'moves')}
					>Explore the moves <ArrowRight size={16} /></button
				>
			</div>
		{/if}
	</Tabs.Content>
	<Tabs.Content value="moves" class="moves-content"
		><div class="move-list-heading">
			<span>THE STORY, MOVE BY MOVE</span><span>{timeline.moves.length} half-moves</span>
		</div>
		<div class="moves-list">
			<div class="move-column-head"><span>#</span><span>{white}</span><span>{black}</span></div>
			{#each movePairs as pair}<div class="move-pair">
					<span>{pair.number}.</span
					>{#each [pair.white, pair.black] as move, colorIndex}{@const movePly =
							colorIndex === 0 ? pair.whitePly : pair.blackPly}{@const quality = demo
							? demoAnalysis.find((q) => q.plies.includes(movePly))
							: null}{#if move}<button
								class:current={ply === movePly}
								aria-label={`Go to ${moveLabel(movePly, timeline.moves)}`}
								aria-current={ply === movePly ? 'step' : undefined}
								onclick={() => go(movePly)}
								>{move.san}{#if quality}<span style={`color:${quality.color}`}
										>{quality.symbol}</span
									>{/if}</button
							>{:else}<span></span>{/if}{/each}
				</div>{/each}
		</div></Tabs.Content
	>
	<Tabs.Content value="evaluation" class="evaluation-content">
		<EvaluationTimeline
			values={demo ? demoEvaluations : null}
			moves={timeline.moves}
			{ply}
			onNavigate={go}
		/>
	</Tabs.Content>
</Tabs.Root>
{#if activeTab === 'overview'}
	<div class="coach-card">
		<div class="coach-heading">
			<span class="coach-icon"><Lightbulb size={18} /></span><span>A MOMENT TO REMEMBER</span><span
				class="coach-sparkle">✧</span
			>
		</div>
		<div class="coach-move">
			<strong>{moveLabel(ply, timeline.moves)}</strong>{#if classification}<span
					class="move-classification"
					style={`--quality-color:${classification.color}`}
					>{classification.symbol} {classification.name} move</span
				>{/if}
		</div>
		{#if demo && ply === 19}<p>
				A little courage goes a long way. This knight sacrifice opens the center while Black’s king
				is still looking for safety.
			</p>{:else if demo && ply === 25}<p>
				Give up the rook, keep the initiative. Every white piece joins the attack, and Black has no
				time to catch up.
			</p>{:else if demo && ply === 31}<p>
				The queen steps into danger to clear the last line. One final rook move will bring the whole
				story together.
			</p>{:else if demo && ply === 33}<p>
				A perfect curtain call. The rook and bishop work together to deliver a beautiful checkmate.
			</p>{:else}<p>
				{demo
					? 'Notice how the active pieces work together. Explore the key moments to see how Morphy turns development into an attack.'
					: 'Take a breath and look at the position. Which pieces are active? Where is the king safest? Look for the next useful move.'}
			</p>{/if}{#if demo}<button class="coach-next" onclick={nextMoment}
				>Next key moment <ArrowRight size={16} /></button
			>{/if}
	</div>
{/if}
