/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/*.{html,jsx}"],
    theme: {
        extend: {
            colors: {
                'np-bg': '#fffefd',
                'np-card': '#f8f7ff'
            },
            boxShadow: {
                'np-input': 'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px',
            },
        },
    },
    plugins: [require("tw-elements/dist/plugin")],
}

