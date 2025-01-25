<script>
	import "../app.css";
	import heart from "../images/heart.svg";

	let { children } = $props();
</script>

<div class="app bg-gray-50">
	<main>
		<div class="bg-white shadow-md mb-6 h-12">
			<div class="flex w-full mx-20 align-middle h-full">
				<img src={heart} class="h-8 my-auto" alt="Heart icon" />
				<p class="my-auto pl-4 text-2xl">Holter Monitor</p>
			</div>
		</div>

		<div class="bg-gray-50 h-screen">
			{@render children()}
		</div>
	</main>
</div>
