// grammar.js - Minimal Haxe Grammar to Start
module.exports = grammar({
  name: 'haxe',

  extras: $ => [
    /\s/,           // Whitespace
    $.comment,      // Comments
  ],

  rules: {
    // Entry point - a Haxe source file
    source_file: $ => repeat($._top_level_item),

    _top_level_item: $ => choice(
      $.class_declaration,
      $.import_statement,
      $.package_statement,
      $.comment,
    ),

    // Package declaration
    package_statement: $ => seq(
      'package',
      optional($.package_path),
      ';'
    ),

    package_path: $ => sep1($.identifier, '.'),

    // Import statement
    import_statement: $ => seq(
      'import',
      $.import_path,
      ';'
    ),

    import_path: $ => sep1(choice($.identifier, '*'), '.'),

    // Basic class declaration
    class_declaration: $ => seq(
      repeat($.access_modifier),
      'class',
      field('name', $.identifier),
      optional($.class_body)
    ),

    access_modifier: $ => choice(
      'public',
      'private',
      'static',
      'inline'
    ),

    class_body: $ => seq(
      '{',
      repeat($._class_member),
      '}'
    ),

    _class_member: $ => choice(
      $.field_declaration,
      $.method_declaration,
      $.comment,
    ),

    // Field declaration
    field_declaration: $ => seq(
      repeat($.access_modifier),
      'var',
      $.identifier,
      optional($.type_annotation),
      optional(seq('=', $.expression)),
      ';'
    ),

    // Method declaration
    method_declaration: $ => seq(
      repeat($.access_modifier),
      'function',
      field('name', $.identifier),
      $.parameter_list,
      optional($.type_annotation),
      choice($.block, ';')
    ),

    parameter_list: $ => seq(
      '(',
      optional(sep1($.parameter, ',')),
      ')'
    ),

    parameter: $ => seq(
      $.identifier,
      optional($.type_annotation)
    ),

    type_annotation: $ => seq(':', $.type),

    type: $ => choice(
      $.identifier,
      $.generic_type
    ),

    generic_type: $ => seq(
      $.identifier,
      '<',
      sep1($.type, ','),
      '>'
    ),

    // Basic expressions
    expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.boolean,
      $.null_literal,
      $.parenthesized_expression,
      $.call_expression,
    ),

    call_expression: $ => seq(
      $.expression,
      $.argument_list
    ),

    argument_list: $ => seq(
      '(',
      optional(sep1($.expression, ',')),
      ')'
    ),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')'
    ),

    // Statements
    block: $ => seq(
      '{',
      repeat($.statement),
      '}'
    ),

    statement: $ => choice(
      $.expression_statement,
      $.return_statement,
      $.if_statement,
      $.block,
    ),

    expression_statement: $ => seq(
      $.expression,
      ';'
    ),

    return_statement: $ => seq(
      'return',
      optional($.expression),
      ';'
    ),

    if_statement: $ => prec.right(seq(
      'if',
      '(',
      $.expression,
      ')',
      $.statement,
      optional(seq('else', $.statement))
    )),

    // Literals
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    
    number: $ => choice(
      /\d+/,                    // Integer
      /\d+\.\d+/,              // Float
      /0x[0-9a-fA-F]+/         // Hex
    ),

    string: $ => choice(
      seq('"', repeat(/[^"\\]|\\./, ), '"'),
      seq("'", repeat(/[^'\\]|\\./, ), "'")
    ),

    boolean: $ => choice('true', 'false'),
    null_literal: $ => 'null',

    // Comments
    comment: $ => choice(
      seq('//', /.*/),                           // Line comment
      seq('/*', repeat(/[^*]|\*[^/]/), '*/')    // Block comment
    ),
  }
});

// Helper function for comma-separated lists
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
