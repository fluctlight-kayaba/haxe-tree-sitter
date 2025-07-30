// From: https://haxe.org/manual/expression-literals.html
const { commaSep, commaSep1 } = require('./utils');

module.exports = {
  // Main "literal" export.
  _literal: ($) =>
    choice($.integer, $.float, $.string, $.bool, $.null, $.regex, $.array, $.map, $.object, $.pair, $.macro_reification),

  // Match any [42, 0xFF43]
  integer: ($) => choice(/[\d_]+/, /0x[a-fA-F\d_]+/),
  // Match any [0.32, 3., 2.1e5]
  float: ($) => choice(/[\d_]+[\.]+[\d_]*/, /[\d_]+[\.]+[\d_]*e[\d_]*/),
  // Match either [true, false]
  bool: ($) => choice('true', 'false'),
  // Match any ["XXX", 'XXX']
  string: ($) =>
    choice(
      seq(/\'/, repeat(choice($.interpolation, $.escape_sequence, /[^\']/)), /\'/),
      seq(/\"/, repeat(choice($.escape_sequence, /[^\"]/)), /\"/),
    ),
  // match only [null]
  null: ($) => 'null',

  // Regex literals: ~/pattern/flags
  regex: ($) => seq(
    '~/',
    repeat(choice(
      $.regex_escape_sequence,
      /[^\/\\\n]/
    )),
    '/',
    optional($.regex_flags)
  ),

  regex_escape_sequence: ($) => seq('\\', /./),
  regex_flags: ($) => /[gimsu]+/,

  // https://haxe.org/manual/expression-array-declaration.html
  array: ($) =>
    choice(
      seq('[', commaSep(prec.left($.expression)), ']'),
      seq('[', $.expression, $.identifier, ']'), //array comprehension
    ),

  // https://haxe.org/manual/expression-map-declaration.html
  map: ($) => prec(1, seq('[', commaSep1($.pair), ']')),

  // https://haxe.org/manual/expression-object-declaration.html  
  object: ($) => prec.right(1, seq('{', commaSep($.pair), optional(','), $._closing_brace)),

  structure_type: ($) => prec(1, seq('{', commaSep(alias($.structure_type_pair, $.pair)), $._closing_brace)),
  structure_type_pair: ($) => prec.left(seq(choice($.identifier), ':', $.type)),

  // Sub part of map and object literals
  pair: ($) =>
    prec.right(1,
      choice(
        seq(choice($.identifier, $.string), ':', choice($.expression, $._literal)),
        seq(choice($.identifier, $._literal), '=>', choice($.expression, $._literal)),
      ),
    ),

  // interplolated string.
  interpolation: ($) =>
    choice(
      $._interpolated_block,
      $._interpolated_identifier,
      //         $._interpolated_expression
    ),
  _interpolated_block: ($) => seq('${', $.expression, '}'),
  _interpolated_identifier: ($) =>
    choice(seq('$', $._lhs_expression), seq('${', $._lhs_expression, '}')),
  _interpolated_expression: ($) => seq('$', seq(token.immediate('{'), $.expression, '}')),

  escape_sequence: ($) =>
    token.immediate(
      seq(
        '\\',
        choice(/[^xu0-7]/, /[0-7]{1,3}/, /x[0-9a-fA-F]{2}/, /u[0-9a-fA-F]{4}/),
        //         choice(/[^xu0-7]/, /[0-7]{1,3}/, /x[0-9a-fA-F]{2}/, /u[0-9a-fA-F]{4}/, /u{[0-9a-fA-F]+}/),
      ),
    ),

  // Macro reification patterns: $e{expr}, $i{ident}, $v{value}, etc.
  macro_reification: ($) =>
    choice(
      seq('$', choice('e', 'i', 'v', 'a', 'b', 'p'), '{', $.expression, '}'),
      seq('$', $.identifier), // Simple variable reification like $name
    ),
};
