git filter-branch --force --index-filter "git rm --cached --ignore-unmatch \"Review Malware Detection Backend Model.md\"" --prune-empty --tag-name-filter cat -- --all
