{{
  function deleteNullValues(object) {
    for (const prop in object) {
    	if (typeof object[prop] === 'object') {
        	object[prop] = deleteNullValues(object[prop]);
        }
    
        if (object[prop] === null) delete object[prop];
    }
    
    if (object && !Object.keys(object).length) return null;
    
    return object;
  }
}}


start
    = logline

logline
    =
    	unix:unix ws
        date:datetime ws
        process:process
        user:user
        error:auth_error_reason?
        ban:ban?
        chat_mute:chat_mute?
        chat_unmute:chat_unmute?
        time:humanized_time?
        numbers:numbers?
        editor:editor?
        activity:activity?
        chat_block: chat_block_type?
        subject:(
            known_user 
            / user_with_timer
        	/ user_with_role
            / user
        )?
        death:death?
        message:message?
        serials:(cn:simple_object / geo:geo_object)?
        	{ 
            	const line = {
                	unix,
                    date,
                    process,
                    user,
                    error,
                    message,
                    time,
                    numbers,
                    subject,
                    death,
                    serials,
                    editor,
                    activity,
                    chat_block,
                    chat_mute,
                    chat_unmute,
                    ban
				};
 
                return deleteNullValues(line);
            }

// Date and time

unix "unix"
	= number
    
datetime "date"
	= year:year month:pad_num day:pad_num "T" hour:pad_num minute:pad_num second:pad_num {
        return text();
    }

pad_num
    = digits:$(DIGIT DIGIT) { return digits; }

year 
    = digits:$(DIGIT DIGIT DIGIT DIGIT) { return digits; }

humanized_time "humanized_time"
	= ws 
    hours:humanized_hours?
    humanized_time_separator?
    minutes:humanized_minutes?
    humanized_time_separator?
    seconds:humanized_seconds?
    ws {
    	return { hours, minutes, seconds };
    }

humanized_time_separator
    = ws ("," / "и")? ws

humanized_time_part
    = humanized_hours
    / humanized_minutes
    / humanized_seconds

humanized_hours "humanized_hours"
	= @hours:number ws "час" ("а" / "ов")?

humanized_minutes "humanized_minutes"
 	= @minutes:number ws "минут" ("a" / "ы")?

humanized_seconds "humanized_seconds"
    = @number ws "секунд" "ы"?

geo_object =
	object:object {
   		object.as = parseInt(object.as);
        
        if (object.props?.length) {
        	object.country = object.props[0];
        }
        
        delete object.props;

        return object;
    }

begin_object      = ws "{" ws
end_object        = ws "}" ws
name_separator    = ws ":" ws
value_separator   = ws "," ws
process_separator = "/"
begin_process     = ws "<" ws
end_process       = ws ">" ws
begin_id          = ws "(" ws
end_id            = ws ")" ws

// Tokens

ws "whitespace" = [ \t\n\r]*

space "space"
	= " "

process_key "process key"
    = $[a-zA-Zа-яА-Я_]i+

process "process" 
	= begin_process head:process_key tail:(process_separator process_key)* end_process { 
    	return [head, ...tail.flat()].join('');
	}

nickname "nickname"
    = $[a-zA-Z0-9\u0400-\u04ff\x2e\x5b\x5d\x5f\x23\x24\x29\x21\x40]i+ { return text(); }
    
id "id"
	= begin_id @number end_id

user "user"
	= nickname:nickname ws id:id? {
    	return id === null ? { nickname } : { nickname, id }; 
    }

known_user "known_user"
	= "id:" id:number ws name:message { return { user: { id, name }}}

user_with_role
	= role:(
    	"Администратор"
        / "Игрок"
        / "Разработчик"
        / "Гость"
    )?
    ws user:user {
    	return { role, ...user };
    }
    
user_with_timer
	= nickname:nickname ws schedule:number { return { timer: { nickname, schedule }}}

// ----- Numbers -----

number "number"
    = minus? int frac? { 
        return parseFloat(text());
    }
 
 numbers "numbers"
	= ws head:number tail:(ws @number)* { return [head, ...tail]; }

decimal_point
    = "."

digits
    = [1-9]

frac
    = decimal_point DIGIT+

int
    = zero / (digits DIGIT*)

minus
    = "-"

plus
    = "+"

zero
    = "0"

// ----- Strings -----

word "word"
	= $[a-zA-Zа-яА-Я]i+
    
ipv4
  = int ("." int)+ {
      return text();
    }

string "string"
  = chars:char* { return text(); }
  
source_char
	= .
    
single_string_char
	= !("'" / escape) source_char { return text(); }
    / sequence:escape { return sequence; }

message "message"
    = "'" chars:single_string_char* "'" { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
      '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

unescaped
  = [^\0-\x1F\x22\x5C]


// ----- Object -----

simple_object "simple_object"
	= begin_object
    members:(
    	head:object_keyvalue
        tail:(value_separator @object_keyvalue)* {
        	return [head, ...tail].reduce((acc, curr) => ({ ...acc, ...curr}), {});
        }
    )?
    end_object {
    	return members !== null ? members: {};
    }

object "object"
 = begin_object 
   members:(
    head:object_member
    tail:(value_separator @object_member)*
    {
        return [head, ...tail].reduce((acc, curr) => {
        	if (typeof curr === 'string') {
            	if (!acc.props) acc.props = [];
            	acc.props.push(curr);
            	
                return acc;
            }
            
            return { ...acc, ...curr };
        }, {})
    }
   )?
   end_object {
        return members !== null ? members: {};
 }
 
object_keyvalue
	= key:object_key name_separator value:object_value {
    		return { [key]: value }
 	}

object_member
	= object_keyvalue
 	/ object_value

object_key
	= $[a-z_]i+

object_value
  = [^,\\{\\}]* { return text(); };

// ----- Core GameServer Rules -----

auth_error_reason
    = reason:("double" / "inactive") ws "account" { return { reason }}

death "death"
	= ws "из" ws @message

chat_block_type
    = "admin"
    / "group"
    / "team"
    / "close"

chat_mute
    = duration:number ws "мин" ws by:("," ws @nickname ws)? reason:message { return { duration, reason, by }};
chat_unmute
    = "админ" ws by:nickname { return { by }}
ban
    = unmute:chat_unmute ws reason:message { return { ...unmute, reason }}

activity_type
    = "baron"
    / "bjump"
    / "climb"
    / "derby"

activity
	= type:activity_type "_id" name_separator id:number { return { type, id }}
    
editor "editor"
	= "editor_id" name_separator editor_id:number value_separator ws
    "g" name_separator group:("owner" / "guest") ws
    members:(
      "("
          head:(key:object_key name_separator value:number { return { [key]: value }; })
          tail: (value_separator key:object_key name_separator value:number { return { [key]: value } })
      ")"
      { return {...head, ...tail } }
    ) {
    	return { editor_id, group, ...members };
    }

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i