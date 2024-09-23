export const replacePlaceholders = (content, queries, schema) => {
    content = content.replaceAll('{examples}', JSON.stringify(queries))
    content = content.replaceAll('{schema}', schema);
    content = content.replaceAll('{db}', 'sqlite3');
    content = content.replaceAll('{today}', new Date().toLocaleDateString('en-CA'));

    return content;
}
