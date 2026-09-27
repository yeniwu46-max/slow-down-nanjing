const config = {
    routingApi: 'http://localhost:8989/',
    geocodingApi: '',
    defaultTiles: 'OpenStreetMap',
    keys: {
        graphhopper: '',
        maptiler: '',
        omniscale: '',
        thunderforest: '',
        kurviger: '',
        tracestrack: '',
    },
    routingGraphLayerAllowed: true,
    request: {
        details: ['road_class', 'road_environment', 'road_access', 'surface'],
    },
    profiles: {
        foot: {},
    },
    profile_group_mapping: {},
}

if (typeof module !== 'undefined') module.exports = config
