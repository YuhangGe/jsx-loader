lexer grammar JSXLexer;


TAG_OPEN: '<' [ \t]* TAG_NameStartChar TAG_NameChar* -> pushMode(HTML), pushMode(TAG);
JS: ~[<{}]+;
LP: '{' -> pushMode(DEFAULT_MODE);
RP: '}' -> popMode;

mode HTML;

HTML_TAG_OPEN: '<' [ \t]* TAG_NameStartChar TAG_NameChar* -> pushMode(HTML), pushMode(TAG);
HTML_CLOSE: '<' [ \t]* '/' [ \t]* TAG_NameStartChar TAG_NameChar* [ \t]* '>' -> popMode;
HTML_LP: '{' -> pushMode(DEFAULT_MODE);
HTML_WS: (' ' | '\t' | '\r'? '\n')+;
HTML_TEXT: ~[<{]+;

mode TAG;

TAG_CLOSE: '>' -> popMode;
TAG_SLASH_CLOSE: '/' [ \t]* '>' -> popMode, popMode;
TAG_EQUALS: '=';
TAG_NAME: TAG_NameStartChar TAG_NameChar*;
TAG_VALUE: DOUBLE_QUOTE_STRING | SINGLE_QUOTE_STRING;
TAG_LP: '{' -> pushMode(DEFAULT_MODE);
TAG_WHITESPACE: [ \t\r\n] -> skip;


fragment DOUBLE_QUOTE_STRING: '"' ~[<"]* '"';

fragment SINGLE_QUOTE_STRING: '\'' ~[<']* '\'';

fragment HEXDIGIT: [a-fA-F0-9];

fragment DIGIT: [0-9];

fragment TAG_NameChar:
  TAG_NameStartChar
  | '-'
  | '_'
  | '.'
  | DIGIT
  | '\u00B7'
  | '\u0300' ..'\u036F'
  | '\u203F' ..'\u2040';

fragment TAG_NameStartChar:
  [:a-zA-Z]
  | '\u2070' ..'\u218F'
  | '\u2C00' ..'\u2FEF'
  | '\u3001' ..'\uD7FF'
  | '\uF900' ..'\uFDCF'
  | '\uFDF0' ..'\uFFFD';
