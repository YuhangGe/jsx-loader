parser grammar JSXParser;

options {
  tokenVocab = JSXLexer;
}

jsx: block+;

block: js
  | htmlElement
  | blockJsx
  ;

blockJsx: LP jsx RP;
js: JS;
htmlElement:
  (HTML_TAG_OPEN | TAG_OPEN) 
    htmlAttributes TAG_CLOSE 
    htmlContent HTML_CLOSE           #htmlWithChildren
 | (HTML_TAG_OPEN | TAG_OPEN)
    htmlAttributes 
    TAG_SLASH_CLOSE                  #htmlNoChildren                        
  ;

htmlContent: htmlChardata? ((htmlContentJsx | htmlElement) htmlChardata?)*;
htmlContentJsx: HTML_LP jsx RP;
htmlChardata: HTML_WS | HTML_TEXT;

htmlAttributes: htmlAttribute*;

htmlAttribute:
  TAG_NAME TAG_EQUALS (
    TAG_VALUE | (TAG_LP jsx RP)
  )
  | TAG_NAME
  ;
