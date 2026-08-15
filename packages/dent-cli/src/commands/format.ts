import { writeFile } from 'node:fs/promises';
import { createFormatter } from '@nsis/dent';
import { Command } from 'commander';
import { blue, dim } from 'kleur/colors';
import { logger } from '../log.ts';
import { applyFormattingOptions } from './options.ts';
import {
	dentOptionsFrom,
	formatParseError,
	hasStdin,
	prepareAction,
	processFiles,
	readStdin,
	type SharedOptions,
} from './shared.ts';

type FormatOptions = SharedOptions & { write: boolean };

export function formatCommand(): Command {
	const cmd = new Command('format')
		.description('format NSIS scripts')
		.arguments('[file...]')
		.action(async (args: string[], _opts, command: Command) => {
			const options = prepareAction<FormatOptions>(args, command);
			await runFormat(args, options);
		});

	applyFormattingOptions(cmd);
	cmd.option('-w, --write', 'edit files in-place', false);

	return cmd;
}

async function runFormat(patterns: string[], options: FormatOptions): Promise<void> {
	const { check } = createFormatter(dentOptionsFrom(options));

	if (!patterns.length && hasStdin()) {
		const rawContents = await readStdin();
		try {
			const result = check(rawContents);
			process.stdout.write(result ?? rawContents);
		} catch (error) {
			logger.error(`${formatParseError(error)}`);
			process.exit(2);
		}
		return;
	}

	if (options.write) {
		logger.start(`Formatting ${patterns.length} ${patterns.length === 1 ? 'file' : 'files'}...`);
	}

	let numFormatted = 0;
	let numUnchanged = 0;

	const { duration, failures } = await processFiles(
		patterns,
		check,
		1,
		async (file, result, rawContents, dur) => {
			if (options.write) {
				if (result === null) {
					numUnchanged++;
					logger.info(`${blue(file)} already formatted ${dim(`(${dur}ms)`)}`);
				} else {
					numFormatted++;
					await writeFile(file, result, { encoding: 'utf-8' });
					logger.info(`${blue(file)} formatted ${dim(`(${dur}ms)`)}`);
				}
			} else {
				process.stdout.write(result ?? rawContents);
			}
		},
		(file, error, dur) => {
			if (options.write) {
				logger.error(`${blue(file)}: ${formatParseError(error)} ${dim(`(${dur}ms)`)}`);
			} else {
				logger.error(`${blue(file)}: ${formatParseError(error)}`);
			}
		},
	);

	if (options.write) {
		const total = numFormatted + numUnchanged;
		const summary =
			numFormatted === 0
				? `All ${total} ${total === 1 ? 'file was' : 'files'} already formatted.`
				: `Formatted ${numFormatted} of ${total} ${total === 1 ? 'file' : 'files'}.`;
		logger.success(`Completed in ${duration}ms. ${summary}`);
	}

	if (failures > 0) {
		process.exit(2);
	}
}
