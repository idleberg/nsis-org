import { writeFile } from 'node:fs/promises';
import { createFormatter } from '@nsis/dent';
import { Command } from 'commander';
import { blue, dim } from 'kleur/colors';
import { logger } from '../log.ts';
import { printDiff } from './diff.ts';
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

type CheckOptions = SharedOptions & { write: boolean; silent: boolean; diff: boolean };

export function checkCommand(): Command {
	const cmd = new Command('check')
		.description('check if NSIS scripts are formatted correctly')
		.arguments('[file...]')
		.action(async (args: string[], _opts, command: Command) => {
			const options = prepareAction<CheckOptions>(args, command);
			if (options.silent) {
				logger.level = 2;
			}
			await runCheck(args, options);
		});

	applyFormattingOptions(cmd);
	cmd.option('-w, --write', 'edit files in-place, if check fails', false);
	cmd.option('-d, --diff', 'print a unified diff for each file with issues', false);
	cmd.option('-S, --silent', 'suppress all output except errors and warnings', false);

	return cmd;
}

async function runCheck(patterns: string[], options: CheckOptions): Promise<void> {
	const { check } = createFormatter(dentOptionsFrom(options));

	if (!patterns.length && hasStdin()) {
		logger.start('Checking standard input...');
		if (options.write) {
			logger.warn('the "--write" option is ignored when reading from stdin.');
		}
		const startTime = performance.now();
		const rawContents = await readStdin();
		let result: string | null;
		try {
			result = check(rawContents);
		} catch (error) {
			const duration = Math.round(performance.now() - startTime);
			logger.error(`${formatParseError(error)} ${dim(`(${duration}ms)`)}`);
			process.exit(2);
		}
		const duration = Math.round(performance.now() - startTime);

		if (result !== null) {
			if (options.diff && !options.silent) {
				printDiff(null, rawContents, result);
			}

			logger.warn(`Script has issues ${dim(`(${duration}ms)`)}`);
			logger.success(`Completed in ${duration}ms.`);
			process.exit(1);
		}

		logger.info(`Script already formatted ${dim(`(${duration}ms)`)}`);
		logger.success(`Completed in ${duration}ms.`);
		return;
	}

	logger.start(`Checking ${patterns.length} ${patterns.length === 1 ? 'file' : 'files'}...`);

	const drifted: string[] = [];
	let unchanged = 0;

	const { duration } = await processFiles(
		patterns,
		check,
		2,
		async (file, result, rawContents, dur) => {
			if (result === null) {
				unchanged++;
				logger.info(`${blue(file)} already formatted ${dim(`(${dur}ms)`)}`);
				return;
			}

			drifted.push(file);

			if (options.diff && !options.silent) {
				printDiff(file, rawContents, result);
			}

			if (options.write) {
				await writeFile(file, result, { encoding: 'utf-8' });
				logger.info(`${blue(file)} formatted ${dim(`(${dur}ms)`)}`);
			} else {
				logger.warn(`${blue(file)} has issues ${dim(`(${dur}ms)`)}`);
			}
		},
		(file, error, dur) => {
			logger.error(`${blue(file)}: ${formatParseError(error)} ${dim(`(${dur}ms)`)}`);
		},
	);

	const total = drifted.length + unchanged;
	const summary =
		drifted.length === 0
			? `All ${total} ${total === 1 ? 'file' : 'files'} formatted correctly.`
			: `Found formatting issues in ${drifted.length} of ${total} ${total === 1 ? 'file' : 'files'}.`;

	logger.success(`Completed in ${duration}ms. ${summary}`);

	if (drifted.length >= 1) {
		process.exit(1);
	}
}
