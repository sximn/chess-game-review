<script lang="ts">
	import { TriangleAlert } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
</script>

{#if app.notice}<div class="toast" role="status"><TriangleAlert size={16} />{app.notice}</div>{/if}

<style>
	.toast {
		position: fixed;
		bottom: 30px;
		left: calc(50% + 113px);
		transform: translateX(-50%);
		z-index: 90;
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: calc(100vw - 32px);
		background: #37432e;
		color: #f9f8e9;
		border: 1px solid #506444;
		box-shadow: 0 8px 24px #26332030;
		border-radius: 12px;
		padding: 14px 20px;
		font-size: 11px;
		animation: toast-in 0.3s var(--ease);
	}
	.toast > :global(svg) {
		color: #d6e4ae;
	}
	@media (max-width: 1200px) {
		.toast {
			left: calc(50% + 101px);
		}
	}
	@media (max-width: 760px) {
		.toast {
			left: 50%;
			bottom: calc(92px + env(safe-area-inset-bottom, 0px));
			font-size: 10px;
			padding: 13px 16px;
			width: max-content;
		}
	}
	@keyframes toast-in {
		from {
			opacity: 0;
			translate: 0 10px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}
</style>
