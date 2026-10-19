//! WebAssembly bindings for the [Ardent](https://github.com/idleberg/ardent) formatter.
//!
//! This crate only translates types between JavaScript and Ardent; all formatting happens in
//! the `ardent` crate.

use serde::Deserialize;
use tsify_next::Tsify;
use wasm_bindgen::prelude::*;

/// Marker to use for single-line comments.
#[derive(Tsify, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum CommentStyle {
	Hash,
	Semi,
}

/// Line ending style for formatted output.
#[derive(Tsify, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum EndOfLine {
	Crlf,
	Lf,
}

impl From<CommentStyle> for ardent::CommentStyle {
	fn from(value: CommentStyle) -> Self {
		match value {
			CommentStyle::Hash => Self::Hash,
			CommentStyle::Semi => Self::Semi,
		}
	}
}

impl From<EndOfLine> for ardent::EndOfLine {
	fn from(value: EndOfLine) -> Self {
		match value {
			EndOfLine::Crlf => Self::Crlf,
			EndOfLine::Lf => Self::Lf,
		}
	}
}

/// Formatter options. Omitted options fall back to the defaults.
#[derive(Tsify, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ArdentOptions {
	/// Marker to use for single-line comments. When omitted, every comment keeps the marker it
	/// was written with. Block comments are never rewritten.
	#[tsify(optional)]
	pub comment_style: Option<CommentStyle>,
	/// Line ending style. When omitted, it is detected from the input.
	#[tsify(optional)]
	pub end_of_line: Option<EndOfLine>,
	/// Number of spaces per indent level, ignored when `useTabs` is `true` (default: 2).
	#[tsify(optional)]
	pub indent_size: Option<u32>,
	/// Maximum line width before wrapping with line continuations, `0` disables wrapping
	/// (default: 120).
	#[tsify(optional)]
	pub print_width: Option<u32>,
	/// Whether to prefer single quotes (default: false).
	#[tsify(optional)]
	pub single_quote: Option<bool>,
	/// Whether to collapse consecutive blank lines and strip leading/trailing blanks
	/// (default: true).
	#[tsify(optional)]
	pub trim_empty_lines: Option<bool>,
	/// Whether to indent with tabs (default: true).
	#[tsify(optional)]
	pub use_tabs: Option<bool>,
}

impl From<ArdentOptions> for ardent::FormatterOptions {
	fn from(options: ArdentOptions) -> Self {
		let defaults = Self::default();

		Self {
			comment_style: options.comment_style.map(Into::into),
			end_of_line: options.end_of_line.map(Into::into),
			indent_size: options
				.indent_size
				.map_or(defaults.indent_size, |value| value as usize),
			print_width: options
				.print_width
				.map_or(defaults.print_width, |value| value as usize),
			single_quote: options.single_quote.unwrap_or(defaults.single_quote),
			trim_empty_lines: options
				.trim_empty_lines
				.unwrap_or(defaults.trim_empty_lines),
			use_tabs: options.use_tabs.unwrap_or(defaults.use_tabs),
		}
	}
}

/// An NSIS script formatter.
#[wasm_bindgen]
pub struct Formatter(ardent::Formatter);

#[wasm_bindgen]
impl Formatter {
	/// Creates a formatter. Throws if an option is invalid.
	#[wasm_bindgen(constructor)]
	pub fn new(
		#[wasm_bindgen(unchecked_param_type = "ArdentOptions | undefined")] options: JsValue,
	) -> Result<Formatter, JsValue> {
		// Deserialised by hand rather than through tsify's ABI so serde's message reaches the caller.
		let options: ArdentOptions = if options.is_undefined() {
			ArdentOptions::default()
		} else {
			serde_wasm_bindgen::from_value(options)?
		};

		ardent::Formatter::new(options.into())
			.map(Self)
			.map_err(|error| JsError::new(&error).into())
	}

	/// Formats an NSIS script. Throws if the input cannot be parsed.
	pub fn format(&self, input: &str) -> Result<String, JsError> {
		self.0.format(input).map_err(|error| JsError::new(&error))
	}

	/// Returns the formatted script, or `undefined` when the input is already formatted.
	pub fn check(&self, input: &str) -> Result<Option<String>, JsError> {
		self.0.check(input).map_err(|error| JsError::new(&error))
	}
}
