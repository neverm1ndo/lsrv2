// LLQL Grammar
// ==================
// Базируется на грамматике логических выражений в JavaScript (ECMA-262, 5.1 Edition)
// Она поддерживает:
//
// *Логические операции &&, ||
// *Сравнения ==, !=
// *Оператор in
// *Массивы (["Stan","Kyle", "Eric", "Kenneth", ...])
// *Диапазоны (1000...50000)
// Cтроки, Числа, Идентификаторы
// Простые маски (127.0.0.*) как строковые литералы.
// ==================
//Примеры запросов: 
// - process == "connection/deny" && serials.ip == "127.0.0.1"
// - nickname == "Mike" || nickname in ["Kyle", "Stan", "Eric", "Kenneth"]
// - serial.as in [1000...50000]
// - country == "Canada" && serials.ip == 127.0.0.*
//

{
  // вспомогательные функции для AST
  function binaryOp(type, left, right) {
    return { type, left, right };
  }
  function node(type, value) {
    return { type, value };
  }
  function buildArray(values) {
    const first = values ? [values[0]] : [];
    const rest = values ? values[1].map(x => x[3]) : [];
    return { type: "Array", elements: first.concat(rest) };
  }
}


Query
  = _ expr:Expression _ { return expr; }


Expression
  = left:OrExpression { return left; }


OrExpression
  = left:AndExpression _ "||" _ right:OrExpression { return binaryOp("LogicalOr", left, right); }
  / AndExpression


AndExpression
  = left:Comparison _ "&&" _ right:AndExpression { return binaryOp("LogicalAnd", left, right); }
  / Comparison


Comparison
  = left:Primary _ "==" _ right:Primary { return binaryOp("Equal", left, right); }
  / left:Primary _ "!=" _ right:Primary { return binaryOp("NotEqual", left, right); }
  / left:Primary _ "in" _ right:Primary { return binaryOp("In", left, right); }
  / left:Primary _ "not" _ "in" _ right:Primary { return binaryOp("NotIn", left, right); }
  / Primary


Primary
  = Literal
  / Identifier
  / Array
  / Range
  / "(" _ expr:Expression _ ")" { return expr; }


Array
  = "[" _ values:(Expression (_ "," _ Expression)*)? _ "]" {
      return buildArray(values);
    }


Range
  = "[" _ start:Number _ "..." _ end:Number _ "]" {
      return { type: "Range", start, end };
    }


Literal
  = String
  / Number


String
  = '"' chars:([^"\\] / '\\' .)* '"' {
      return node("String", chars.join(""));
    }


Number
  = digits:[0-9]+ {
      return node("Number", parseInt(digits.join(""), 10));
    }


Identifier
  = parts:([a-zA-Z_][a-zA-Z0-9_]* ("." [a-zA-Z_][a-zA-Z0-9_]*)*) {
      return node("Identifier", text());
    }


_ "whitespace"
  = [ \t\n\r]*

// ------------