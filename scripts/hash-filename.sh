#!/usr/bin/env bash

HASH_LENGTH=5

input_file="$1"
shift

file_name="$(basename "$input_file" | grep -o "[^.]\+" | head -1)"
directory_name="$(dirname "$input_file")"
extension="$(basename "$input_file" | grep -o "\..*")"
hash="$(shasum "$input_file" | cut -c -$HASH_LENGTH)"

for target_file in "$@"; do
  sed -i "$target_file" -e "s/$file_name$extension/$file_name.$hash$extension/g"
done

echo "$input_file" "$directory_name/$file_name.$hash$extension"
mv "$input_file" "$directory_name/$file_name.$hash$extension"
