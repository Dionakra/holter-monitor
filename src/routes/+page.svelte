<script lang="ts">
	import DatParser, { type Signal } from "$lib/DatParser";

	// ECharts stuff
	import { echarts } from "../lib/echarts";
	let options: any[] = [];

	// Files stuff
	let files: File[] = [];
	let isDragging: boolean = false;
	let fileInput;

	// File content stuff
	let datContent: ArrayBuffer | null = null;
	let headerContent: string | null = null;

	// Read the .hea file as text
	function readAsText(file: File): Promise<string> {
		const reader = new FileReader();
		return new Promise((resolve, reject) => {
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = reject;
			reader.readAsText(file, "utf-8");
		});
	}

	// Read the .dat file as an Array Buffer
	function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
		const reader = new FileReader();
		return new Promise((resolve, reject) => {
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		});
	}

	// Handle file upload
	async function handleFiles(selectedFiles: FileList) {
		options = [];
		for (const file of Array.from(selectedFiles)) {
			// We only take into account .hea and .dat files
			if (!file.name.endsWith(".hea") && !file.name.endsWith(".dat")) {
				continue;
			}

			// If the file is not already saved
			const fileNames = files.map((x) => x.name);
			if (!fileNames.includes(file.name)) {
				// We save it
				files = [...files, file];

				// And depending on the file extensions, we parse the content one way or another
				if (file.name.endsWith(".hea")) {
					headerContent = await readAsText(file);
				} else if (file.name) {
					datContent = await readAsArrayBuffer(file);
				}
			}
		}

		// If after processing the files we have both files, we start showing the data
		if (datContent != null && headerContent != null) {
			// Parse the files to get the measures
			const { metadata, samples } = await DatParser.parse(
				datContent,
				headerContent,
			);

			console.log(metadata);

			// We calculate the values of the xAxis based on the base date and sampleRate
			const xAxis = [];
			const msPerSample = 1 / metadata.sampleRate;
			for (let i = 0; i < metadata.numSamples; i++) {
				// For each sample, calculate which time did it happen
				const sampleDate: Date = new Date(metadata.initialDate);
				sampleDate.setTime(
					sampleDate.getTime() + metadata.sampleRate * i,
				);

				// And format it in a nice way
				xAxis[i] =
					`${sampleDate.getHours().toString().padStart(2, "0")}:${sampleDate.getMinutes().toString().padStart(2, "0")}:${sampleDate.getSeconds().toString().padStart(2, "0")} `;
			}

			// Finally, for each signal, we draw a chart
			for (let i = 0; i < metadata.numSignals; i++) {
				options = [
					...options,
					getOptions(xAxis, samples[i], metadata.signals[i], i),
				];
			}
		}
	}

	// Events for loading files
	function onDragOver(event: any) {
		event.preventDefault();
		isDragging = true;
	}

	function onDragLeave() {
		isDragging = false;
	}

	function onDrop(event: any) {
		event.preventDefault();
		isDragging = false;
		handleFiles(event.dataTransfer.files);
	}

	function onFileInputChange(event: any) {
		handleFiles(event.target.files);
	}

	// ECharts configuration
	function getOptions(
		xAxis: string[],
		samples: number[],
		signal: Signal,
		i: number,
	) {
		xAxis = xAxis.slice(0, 500000);
		samples = samples.slice(0, 500000);

		return {
			tooltip: {
				trigger: "axis",
				position: function (pt) {
					return [pt[0], "10%"];
				},
			},
			title: {
				left: "center",
				text: `Channel ${i + 1}`,
			},
			toolbox: {
				feature: {
					dataZoom: {
						yAxisIndex: "none",
					},
					restore: {},
				},
			},
			xAxis: {
				type: "category",
				boundaryGap: false,
				data: xAxis,
			},
			yAxis: {
				type: "value",
				axisLabel: {
					formatter: `{value} ${signal.units}`,
				},
			},
			dataZoom: [
				{
					type: "inside",
					start: 0,
					end: 3,
				},
				{
					start: 0,
					end: 3,
				},
			],
			series: [
				{
					type: "line",
					symbol: "none",
					sampling: "lttb",
					itemStyle: {
						color: "rgb(255, 70, 131)",
					},
					large: true,

					data: samples,
					markLine: {
						data: [
							[
								{
									symbol: "none",
									x: "90%",
									yAxis: "max",
								},
								{
									symbol: "circle",
									label: {
										position: "start",
									},
									type: "max",
								},
							],
							[
								{
									symbol: "none",
									x: "90%",
									yAxis: "min",
								},
								{
									symbol: "circle",
									label: {
										position: "start",
									},
									type: "min",
								},
							],
						],
					},
				},
			],
		};
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<p class="text-center pb-4">
	Example <strong>.dat</strong> and <strong>.hea</strong> files can be found
	at
	<a
		href="https://physionet.org/content/shdb-af/1.0.0/"
		class="underline text-red-700"
		target="_blank">PhysioNet</a
	>.
</p>

<div
	on:click={() => fileInput.click()}
	class="w-1/2 bg-white mx-auto cursor-pointer hover:bg-red-100 shadow-red-100 rounded-md px-4 text-center py-2 border-4 border-dotted border-red-400 shadow-lg {isDragging
		? 'bg-yellow-50'
		: ''}"
	on:dragover={onDragOver}
	on:dragleave={onDragLeave}
	on:drop={onDrop}
>
	<p>
		{isDragging
			? "Drop your files here"
			: "Drag and drop files here or click to upload"}
	</p>
	<input
		type="file"
		multiple
		hidden
		bind:this={fileInput}
		on:change={onFileInputChange}
	/>
</div>

{#if options.length > 0}
	{#each options as option}
		<div class="containere w-full mt-5" use:echarts={option}></div>
	{/each}
{/if}

<style>
	.containere {
		width: 100%;
		height: 500px;
	}
</style>
