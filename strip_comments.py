import tokenize
import io
import sys

def remove_comments(file_path):
    with open(file_path, 'r') as f:
        source = f.read()

    result = []
    tokens = tokenize.generate_tokens(io.StringIO(source).readline)
    last_lineno = -1
    last_col = 0
    
    try:
        for tok in tokens:
            token_type = tok[0]
            token_string = tok[1]
            start_line, start_col = tok[2]
            end_line, end_col = tok[3]
            
            if start_line > last_lineno:
                last_col = 0
            if start_col > last_col:
                result.append(" " * (start_col - last_col))
                
            if token_type == tokenize.COMMENT:
                pass
            else:
                result.append(token_string)
                
            last_lineno = end_line
            last_col = end_col
            
        with open(file_path, 'w') as f:
            f.write("".join(result))
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

remove_comments('artisan-analyzer/app.py')
remove_comments('CrafLenze/main.py')
print("Done stripping comments.")
