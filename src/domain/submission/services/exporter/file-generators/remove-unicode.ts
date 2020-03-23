export const removeUnicode = (str: string, index: number): string => {
    let newStr = str.replace(/[^\x00-\x7F]/g, '');
    if (newStr !== str) {
        newStr = `${index}_${newStr}`;
    }
    return newStr;
};
