import React from 'react';

export default function About() {

    // helper to load images on GitHub Pages
    const getAssetUrl = (path) => {
        const baseUrl = import.meta.env.BASE_URL;
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        return `${cleanBase}${path}`;
    };

    return (
        <div className="bg-white min-h-screen">

            {/* Hero Section */}
            <div
                className="w-full relative pt-32 pb-16 px-4 text-center bg-cover bg-center"
                style={{ backgroundImage: `url(${getAssetUrl("images/about.jpg")})` }}
            >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60"></div>

                {/* Content */}
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-md">
                        About
                    </h1>
                    <p className="text-xl text-gray-200 max-w-3xl mx-auto drop-shadow-sm">
                        Learn more about the mission and team behind Police District Demographics.
                    </p>
                </div>
            </div>
        </div>
    );
}
