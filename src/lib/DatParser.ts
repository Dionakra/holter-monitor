export type Metadata = {
    recordName: string;
    numSignals: number;
    sampleRate: number;
    numSamples: number;
    initialDate: Date;
    signals: Signal[];
};

export type Signal = {
    filename: string;
    gain: number;
    baseline: number;
    units: string;

};

export type HolterData = {
    metadata: Metadata;
    samples: number[][];
}

export default class DatParser {

    static async parse(
        binaryData: ArrayBuffer,
        headerContent: string,
    ): Promise<HolterData> {
        try {
            const metadata: Metadata = DatParser.parseHeader(headerContent);
            const samples = DatParser.parseBinaryData(binaryData, metadata);

            return {
                metadata,
                samples,
            };
        } catch (error) {
            console.error(`Error parsing WFDB file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Parses the header (.hea) file content to extract metadata.
     * @param {string} headerContent - Content of the .hea file.
     * @returns {object} - Extracted metadata.
     */
    static parseHeader(headerContent: string): Metadata {
        const lines: string[] = headerContent
            .split("\n")
            .filter((line) => line.trim() !== "");

        const [headerLine, ...signalLines] = lines;

        // Parse main header line
        const [recordName, numSignals, sampleRate, numSamples, startHour, startDate] =
            headerLine.split(/\s+/);

        // Parse signal lines
        const signals: Signal[] = signalLines.map((line) => {
            const [filename, resolution, gainAndBaseline] = line.split(/\s+/);
            return {
                filename,
                gain: parseFloat(gainAndBaseline),
                baseline: parseInt(gainAndBaseline.split("(")[1]),
                units: gainAndBaseline.split("/")[1]

            };
        });

        return {
            recordName: recordName,
            numSignals: parseInt(numSignals, 10),
            sampleRate: parseInt(sampleRate, 10),
            numSamples: parseInt(numSamples, 10),
            initialDate: new Date(`${startDate} ${startHour}`),
            signals: signals,
        };
    }

    static parseBinaryData(
        binaryData: ArrayBuffer,
        metadata: Metadata,
    ): number[][] {
        const dataView = new DataView(binaryData);
        const numSignals = metadata.numSignals;
        const numSamples = metadata.numSamples;
        const totalSamples = numSignals * numSamples;
        const requiredBytes = totalSamples * 2; // 2 bytes per 16-bit sample

        // Ensure the binary file size matches expectations
        if (binaryData.byteLength < requiredBytes) {
            throw new Error(
                `Insufficient data in .dat file. Expected ${requiredBytes} bytes but found ${binaryData.byteLength} bytes.`,
            );
        }

        const samples: number[][] = Array.from(
            { length: numSignals },
            () => [],
        );

        for (let i = 0; i < numSamples; i++) {
            for (let signalIndex = 0; signalIndex < numSignals; signalIndex++) {
                const sampleIndex = i * numSignals + signalIndex;
                const rawValue = dataView.getInt16(sampleIndex * 2, true); // Little-endian
                const { gain, baseline } = metadata.signals[signalIndex];
                const calibratedValue = (rawValue - baseline) / gain;
                samples[signalIndex].push(calibratedValue);
            }
        }

        return samples;
    }

}