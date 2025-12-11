/**
 * Fits an aspect ratio inside a max-width/max-height box (CSS: object-fit: contain)
 */
export function containAspectSize(
    aspect: number,
    maxWidth: number,
    maxHeight: number
) {
    const widthBasedOnHeight = maxHeight * aspect;

    if (widthBasedOnHeight <= maxWidth) {
        return {
            width: widthBasedOnHeight,
            height: maxHeight,
        };
    }

    const heightBasedOnWidth = maxWidth / aspect;

    return {
        width: maxWidth,
        height: heightBasedOnWidth,
    };
}
