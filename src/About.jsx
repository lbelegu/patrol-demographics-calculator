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
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto py-12 px-6 text-gray-800 leading-relaxed">
                <p className="mb-6">
                    The Patrol Demographics Calculator is a tool used for estimating the population demographics of a given geographic area in the United States. The numbers provided by this application are generated via simple areal interpolation using the <a href="https://www.census.gov/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">United States Census (American Community Survey)</a>, as further described in <a href="https://lbelegu.github.io/police-district-demographics/methodology" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Methodology</a>.
                </p>

                <p className="mb-6">
                    Based on <a href="https://web.stanford.edu/~csimoiu/doc/traffic-stops.pdf" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">research and publications</a> analyzing nearly 100 million municipal and state patrol traffic stops conducted across the country, we believe there are racial disparities and bias that disproportionately affects minority drivers. While this research is widely available and known to the public, we believe there is a gap in tools and data which allow the targets of racial bias in traffic stops to litigate and defend themselves from discrimination and prosecution in court.
                </p>

                <p className="mb-6">
                    When public defenders litigate traffic stop cases to defend their clients, they need to prove whether stops were racially motivated towards their defendant. However, the units at which the US Census reports the racial population metrics of an area do not align with police patrol areas, which contain data such as ”report stop-level data, including driver demographics, the reason for the stop, search and contraband details, whether the stop resulted in an arrest, whether use of force was involved, and other details about the encounter”. This makes it challenging to evaluate whether a pattern of enforcement is suggestive of discriminatory intent and effect, or if it is reflective of the demographics of the region. Thus, a tool like this one is necessary to recalculate the demographics of these areas as a preliminary estimate for what these racial proportions may be.
                </p>

                <p className="mb-6">
                    Originally commissioned by <a href="https://emancipatenc.org/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">North Carolina Emancipate</a> and <a href="https://www.urban.org/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Urban Institute</a> in May 2025, the first prototype of this tool was created in the wake of a North Carolina Supreme Court ruling that indicated the need for reliable estimates for patrol district populations in district-related rulings. Having judged this first version, which only provided estimates for North Carolina cities, as useful across the United States, a group of civic technologists worked to rebuild the application at a national scale. The Patrol Demographics Calculator was created in association with <a href="https://www.newamerica.org/teaching-learning-tech/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">New America’s Teaching Learning and Tech</a> team and their <a href="https://www.build4good.tech" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">build4good</a> program.
                </p>

                <p className="mb-6">
                    While the calculation of these estimations is rudimentary, the Patrol Demographics Calculator calls on contributors to assist in crowdsourcing the necessary geospatial patrol district files from cities across the United States. These files, which provide the georeferenced (latitudinal and longitudinal location) boundaries for the district polygons, are only immediately available for a portion of the United States’ cities. Without these files, no overlay calculations can take place.
                </p>

                <div className="mb-6">
                    <p className="font-bold mb-2">Our data gathering procedure was as follows:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Source publicly-available geospatial files from city ESRI hubs, when possible.</li>
                        <li>Georeference patrol districts overlaid with city maps to translate images to coordinates.</li>
                        <li>Submit Freedom of Information Act requests to obtain these geospatial files when neither of the above information sources were available.</li>
                    </ul>
                </div>

                <p className="mb-6 italic bg-gray-50 p-4 border-l-4 border-yellow-500">
                    Users of this tool should be wary of overreliance on the provided estimates. Because these calculations are simply aggregations of proportional overlays between census blocks and patrol districts (see Methodology), the numbers provided by this tool are, at best, crude approximations. Any attempt to use these values as non-residential estimations (ex. driving population estimates) should be done with even more wariness, as non-residential groups may not necessarily proportionally reflect populations living within a given area.
                </p>
            </div>
        </div>
    );
}