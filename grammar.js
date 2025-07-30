const operators = require('./grammar/operators');
const literals = require('./grammar/literals');
const declarations = require('./grammar/declarations');
const builtins = require('./grammar/builtins');

const { commaSep, commaSep1 } = require('./grammar/utils');

const preprocessor_statement_start_tokens = ['if', 'elseif'];
const preprocessor_statement_end_tokens = ['else', 'end'];

module.exports = grammar({
  name: 'haxe',
  externals: ($) => [$._lookback_semicolon, $._closing_brace_marker, $._closing_brace_unmarker],
  word: ($) => $.identifier,
  extras: ($) => [$.comment, /[\s\uFEFF\u2060\u200B\u00A0]/, $._closing_brace_unmarker],
  inline: ($) => [$.statement, $.expression],
  supertypes: ($) => [$.declaration],
  conflicts: ($) => [
    [$.block, $.object],
    [$.typedef_declaration, $.type],
    [$._rhs_expression, $.pair],
    [$._literal, $.pair],
    [$.pair, $.pair],
    [$.function_declaration],
    [$.function_type, $.variable_declaration],
    [$.type, $.function_type, $.variable_declaration],
    [$.type, $._function_type_args],
    [$.structure_type_pair, $._function_type_args],
    [$.function_declaration, $.variable_declaration],
    [$._prefixUnaryOperator, $._arithmeticOperator],
    [$._prefixUnaryOperator, $._postfixUnaryOperator],
    [$._rhs_expression, $.arrow_function_parameter],
    [$.arrow_function_parameter, $.function_type],
    [$.arrow_function_parameter, $.structure_type_pair],
    [$.arrow_function_parameter, $._function_type_args, $.structure_type_pair],
    [$.arrow_function_parameter, $._function_type_args],
    [$.object, $.block],
    [$.pair, $.structure_type_pair],
    [$._lhs_expression, $.pair],
  ],
  rules: {
    module: ($) => seq(repeat($.statement)),
    statement: ($) =>
      // Use prec.left to favor rules that end SOONER
      // this means a semicolon ends the statement.
      prec.left(
        choice(
          $.preprocessor_statement,
          $.import_statement,
          $.using_statement,
          $.package_statement,
          $.declaration,
          $.switch_expression,
          seq($.expression, $._lookback_semicolon),
          $.conditional_statement,
          $.throw_statement,
          $.block,
        ),
      ),

    preprocessor_statement: ($) =>
      prec.right(
        seq(
          '#',
          choice(
            seq(token.immediate(choice(...preprocessor_statement_start_tokens)), $.expression),
            token.immediate(choice(...preprocessor_statement_end_tokens)),
          ),
        ),
      ),

    package_statement: ($) =>
      seq(
        'package',
        optional(field('name', seq(repeat(seq($.package_name, '.')), $.package_name))),
        $._semicolon,
      ),

    package_name: ($) => $._camelCaseIdentifier,
    type_name: ($) => $._pascalCaseIdentifier,
    _type_path: ($) => seq(repeat(seq($.package_name, '.')), repeat(seq($.type_name, '.')), $.type_name),

    import_statement: ($) =>
      seq(
        'import',
        seq(
          repeat(seq($.package_name, '.')),
          repeat(seq($.type_name, '.')),
          choice(
            '*',
            seq($.type_name, optional(seq('.', alias($._camelCaseIdentifier, $.identifier)))),
          )
        ),
        optional(seq(choice('as', 'in'), choice($.type_name, alias($._camelCaseIdentifier, $.identifier)))),
        $._semicolon,
      ),

    using_statement: ($) =>
      seq(
        'using',
        seq(repeat(seq($.package_name, '.')), repeat(seq($.type_name, '.')), $.type_name),
        $._semicolon,
      ),

    throw_statement: ($) => prec.right(seq('throw', $.expression, $._lookback_semicolon)),

    _rhs_expression: ($) =>
      prec.right(choice($._literal, $.identifier, $.member_expression, $.call_expression)),

    _unaryExpression: ($) =>
      prec.left(
        1,
        choice(
          // unary on LHS
          seq($.operator, $._rhs_expression),
          // unary on RHS
          seq($._rhs_expression, $.operator),
        ),
      ),

    runtime_type_check_expression: ($) =>
      prec(20, seq('(', alias($.structure_type_pair, 'type_check'), ')')),
    //     runtime_type_check_expression: ($) => prec.left(10, seq('(', $.pair, ')')),

    switch_expression: ($) =>
      prec.right(
        seq(
          'switch',
          choice($.identifier, $._parenthesized_expression),
          alias($.switch_block, $.block),
        ),
      ),

    _closing_brace: ($) => seq($._closing_brace_marker, '}'),

    switch_block: ($) => seq('{', repeat($.case_statement), $._closing_brace),

    case_statement: ($) =>
      prec.right(
        choice(
          seq('case', choice($._rhs_expression, alias('_', $._rhs_expression)), ':', $.statement),
          seq('default', ':', $.statement),
        ),
      ),

    cast_expression: ($) =>
      choice(
        seq('cast', $._rhs_expression),
        seq('cast', '(', $._rhs_expression, optional(seq(',', field('type', $.type))), ')'),
      ),

    type_trace_expression: ($) => seq('$type', '(', $._rhs_expression, ')'),

    _parenthesized_expression: ($) => seq('(', repeat1(prec.left($.expression)), ')'),

    range_expression: ($) =>
      prec(
        1,
        seq($.identifier, 'in', choice(seq($.integer, $._rangeOperator, $.integer), $.identifier)),
      ),

    // Arrow functions: (param:Type) -> expression
    arrow_function: ($) =>
      prec.right(
        choice(
          // () -> expression
          seq('(', ')', '->', $.expression),
          // (params) -> expression  
          seq('(', commaSep1($.arrow_function_parameter), ')', '->', $.expression),
          // param -> expression (single param without parens)
          seq($.arrow_function_parameter, '->', $.expression),
        ),
      ),

    arrow_function_parameter: ($) =>
      seq(
        optional('?'), // Optional parameter
        field('name', $.identifier),
        optional(seq(':', field('type', $.type))),
        optional(seq('=', field('default', $.expression))),
      ),

    expression: ($) =>
      prec.right(choice(
        $.assignment_expression,
        $._unaryExpression,
        $.subscript_expression,
        $.runtime_type_check_expression,
        $.cast_expression,
        $.type_trace_expression,
        $.range_expression,
        $._parenthesized_expression,
        $.switch_expression,
        $.arrow_function,
        // simple expression, or chained.
        seq($._rhs_expression, repeat(seq($.operator, $._rhs_expression))),
        seq('return', optional($._rhs_expression)),
        seq('untyped', $._rhs_expression),
        'break',
        'continue',
      )),

    assignment_expression: ($) =>
      prec.right(seq(
        field('left', $._lhs_expression),
        field('operator', $._assignmentOperator),
        field('right', $.expression),
      )),

    subscript_expression: ($) =>
      prec.left(
        1,
        seq(
          choice($.identifier, $._parenthesized_expression, $.member_expression),
          '[',
          field('index', $.expression),
          ']',
        ),
        //           seq($._parenthesized_expression, '[', field('index', $.expression), ']'),
      ),

    member_expression: ($) =>
      prec.right(
        seq(
          choice(field('object', choice('this', $.identifier)), field('literal', $._literal)),
          choice(token('.'), seq(alias('?', $.operator), '.')),
          repeat1(field('member', $._lhs_expression)),
        ),
      ),

    _lhs_expression: ($) => prec(1, choice($.identifier, $.member_expression)),

    builtin_type: ($) => prec.right(choice(...builtins)),

    _function_type_args: ($) => commaSep1(seq(optional(seq($.identifier, ':')), $.type)),

    function_type: ($) =>
      prec.right(
        choice(
          seq('(', ')', '->', $.type),
          seq($.type, '->', field('return_type', $.type)),
          seq('(', $._function_type_args, ')', '->', $.type),
        ),
      ),

    type: ($) =>
      prec.right(
        choice(
          seq(
            choice(
              field('type_name', $._lhs_expression),
              field('built_in', alias($.builtin_type, $.identifier)),
            ),
            optional($.type_params),
          ),
          $.function_type,
          seq('(', alias($.type, 'type'), ')'),
        ),
      ),

    block: ($) => seq('{', repeat($.statement), $._closing_brace),

    metadata: ($) =>
      seq(
        choice(token('@'), token('@:')),
        field('name', $._lhs_expression),
        optional(seq('(', $.expression, ')')),
      ),

    // arg list is () with any amount of expressions followed by commas
    _arg_list: ($) => prec.right(seq('(', commaSep($.expression), ')')),

    conditional_statement: ($) =>
      prec.right(
        1,
        seq(
          field('name', 'if'),
          field('arguments_list', $._arg_list),
          optional($.block),
          optional(seq(choice('else', 'else if'), $.block)),
        ),
      ),

    _call: ($) =>
      prec(
        1,
        seq(
          field('object', $._lhs_expression),
          optional($.type_params),
          field('arguments_list', $._arg_list),
        ),
      ),

    _constructor_call: ($) =>
      seq(
        'new',
        seq(
          repeat(seq($.package_name, '.')),
          repeat(seq($.type_name, '.')),
          field('constructor', $.type_name),
          optional($.type_params),
          field('arguments_list', $._arg_list),
        ),
      ),

    call_expression: ($) => choice($._call, $._constructor_call),

    ...operators,
    ...declarations,
    ...literals,

    comment: ($) => token(choice(seq('//', /.*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'))),
    // TODO: implement the structures that use these
    keyword: ($) => choice('catch', 'do', 'enum', 'for', 'try', 'while'),
    // keywords reserved by the haxe compiler that are not currently used
    reserved_keyword: ($) => choice('operator'),
    identifier: ($) => /[a-zA-Z_]+[a-zA-Z0-9]*/,
    // Hidden Nodes in tree.
    _camelCaseIdentifier: ($) => /[a-z_]+[a-zA-Z0-9]*/,
    _pascalCaseIdentifier: ($) => /[A-Z]+[a-zA-Z0-9]*/,
    _semicolon: ($) => $._lookback_semicolon,
  }
});

// Helper function for comma-separated lists
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
