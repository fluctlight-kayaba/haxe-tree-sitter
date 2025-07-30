; Minimal highlights.scm that matches your current grammar

; Keywords
[
  "class"
  "function" 
  "var"
  "return"
  "if"
  "else"
  "package"
  "import"
  "public"
  "private" 
  "static"
  "inline"
] @keyword

; Types and declarations
(class_declaration name: (identifier) @type.definition)
(method_declaration name: (identifier) @function)
(field_declaration (identifier) @variable)
(parameter (identifier) @variable.parameter)

; Literals
(string) @string
(number) @number
(boolean) @boolean
(null_literal) @constant.builtin

; Comments
(comment) @comment

; Identifiers (fallback)
(identifier) @variable

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ";"
  ","
  "."
] @punctuation.delimiter

":" @punctuation.special
