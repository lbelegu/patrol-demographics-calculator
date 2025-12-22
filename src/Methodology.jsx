import React from 'react';

export default function Methodology() {

    // helper to load images on GitHub Pages
    const getAssetUrl = (path) => {
        const baseUrl = import.meta.env.BASE_URL;
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        return `${cleanBase}${path}`;
    };

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-6">

                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Methodology</h1>
                    <p className="text-xl text-gray-600">
                        How we calculate demographic data for custom police districts using U.S. Census Block Groups.
                    </p>
                </div>

                {/* Introduction Text */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">The Challenge</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Police districts rarely align with standard census boundaries. This makes it difficult to know exactly
                        who lives in a specific patrol zone. To solve this, we use a technique called
                        <strong className="text-blue-600"> Areal Interpolation</strong> (weighted spatial intersection).
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Below is a step-by-step example using data from <strong>Raleigh, NC</strong> to demonstrate how we transform raw maps into demographic insights.
                    </p>
                </div>

                {/* Step-by-Step Walkthrough */}
                <div className="space-y-16">

                    {/* Step 1 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">1</span>
                            <h3 className="text-xl font-bold text-gray-900">Police Districts</h3>
                        </div>
                        <p className="text-gray-700 mb-6 pl-11">
                            The entire city of Raleigh has 6 police districts, all of which are made up of one or more complicated polygons.
                        </p>
                        <img
                            src={getAssetUrl("images/methodology_img1.png")}
                            alt="Map of Raleigh Police Districts"
                            className="w-full rounded-lg shadow-md border border-gray-200"
                        />
                    </section>

                    {/* Step 2 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">2</span>
                            <h3 className="text-xl font-bold text-gray-900">Census Neighborhood Populations</h3>
                        </div>
                        <div className="pl-11 text-gray-700 mb-6 space-y-3">
                            <p>
                                Independently of overlapping police districts, each census neighborhood has a certain population. This population includes individuals of various racial and age groups.
                            </p>
                            <p>
                                Because neighborhoods are shaped in various ways, they are unevenly populated. One neighborhood may have several thousand residents, while another may have only a few hundred.
                            </p>
                        </div>
                        <img
                            src={getAssetUrl("images/methodology_img2.png")}
                            alt="Map of Census Neighborhoods"
                            className="w-full rounded-lg shadow-md border border-gray-200"
                        />
                    </section>

                    {/* Step 3 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">3</span>
                            <h3 className="text-xl font-bold text-gray-900">District Area Overlap</h3>
                        </div>
                        <div className="pl-11 text-gray-700 mb-6 space-y-3">
                            <p>
                                In order to calculate the populations of each police district, we refer to smaller census neighborhoods. While we can overlay census neighborhoods with our police district, the geometries are not easily relatable.
                            </p>
                            <p>
                                Some census neighborhoods, which are fully within the district borders, have 100% of their area within the district. However, many more are only partially in the district; these neighborhoods can either have very minimal area overlap (e.g., 5%) or quite a lot (e.g., 80%).
                            </p>
                            <p>
                                Thus, in order to accurately calculate the number of residents within a district from a given census neighborhood, we calculate the area overlap between each neighborhood and the district.
                            </p>
                        </div>
                        <img
                            src={getAssetUrl("images/methodology_img3.png")}
                            alt="Diagram showing overlap calculation"
                            className="w-full rounded-lg shadow-md border border-gray-200"
                        />
                    </section>

                    {/* Step 4 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">4</span>
                            <h3 className="text-xl font-bold text-gray-900">Neighborhood-District Populations</h3>
                        </div>
                        <p className="text-gray-700 mb-6 pl-11">
                            Using this area overlap, we calculate the number of residents in each census block that live in each police district. These values are directly representative of population density within a given census block and its geographical overlap with neighboring patrol areas.
                        </p>
                        <img
                            src={getAssetUrl("images/methodology_img4.png")}
                            alt="Map showing calculated population fragments"
                            className="w-full rounded-lg shadow-md border border-gray-200"
                        />
                    </section>

                    {/* Step 5 */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">5</span>
                            <h3 className="text-xl font-bold text-gray-900">Final Aggregation</h3>
                        </div>
                        <p className="text-gray-700 mb-6 pl-11">
                            By aggregating each of these individual populations, we can calculate the total populations and relevant demographics of each patrol area.
                        </p>
                        <img
                            src={getAssetUrl("images/methodology_img5.png")}
                            alt="Final map of Police Patrol District Populations"
                            className="w-full rounded-lg shadow-md border border-gray-200"
                        />
                    </section>

                </div>
            </div>
        </div>
    );
}