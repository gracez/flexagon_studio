// Studio presets for libmypaint 1.3.0. These are settings, not image stamps.
export const BRUSH_PRESETS = [
 {id:'ink',name:'Round ink',category:'Ink',tool:'ink',size:18,softness:.05,settings:{}},
 {id:'fineliner',name:'Fineliner',category:'Ink',tool:'ink',size:5,softness:0,radiusPressure:-.12,settings:{dabs_per_basic_radius:5}},
 {id:'nib',name:'Chisel nib',category:'Ink',tool:'ink',size:26,softness:.04,settings:{elliptical_dab_ratio:4,elliptical_dab_angle:40}},
 {id:'pencil',name:'Graphite',category:'Dry media',tool:'pencil',size:9,softness:.2,settings:{}},
 {id:'charcoal',name:'Charcoal',category:'Dry media',tool:'pencil',size:40,softness:.35,opacityMultiplier:.55,settings:{radius_by_random:.6,offset_by_random:.45,elliptical_dab_ratio:1.6}},
 {id:'pastel',name:'Pastel',category:'Dry media',tool:'pencil',size:36,softness:.1,settings:{elliptical_dab_ratio:2.5,elliptical_dab_angle:20,dabs_per_basic_radius:7,offset_by_random:.15}},
 {id:'round-paint',name:'Round paint',category:'Paint',tool:'ink',size:44,softness:.2,settings:{slow_tracking_per_dab:.3}},
 {id:'flat-paint',name:'Flat paint',category:'Paint',tool:'ink',size:48,softness:.12,settings:{elliptical_dab_ratio:5,elliptical_dab_angle:70,slow_tracking_per_dab:.25}},
 {id:'wash',name:'Soft wash',category:'Paint',tool:'wash',size:64,softness:.8,settings:{}},
 {id:'dry',name:'Dry brush',category:'Texture',tool:'pencil',size:38,softness:.15,settings:{elliptical_dab_ratio:3,offset_by_random:.7,radius_by_random:.45,dabs_per_basic_radius:2}},
 {id:'stipple',name:'Stipple',category:'Texture',tool:'ink',size:12,softness:0,settings:{offset_by_random:1.8,radius_by_random:.4,dabs_per_basic_radius:1,dabs_per_actual_radius:1,dabs_per_second:40}},
 {id:'eraser',name:'Hard eraser',category:'Erasers',tool:'eraser',size:48,softness:0,settings:{}},
 {id:'soft-eraser',name:'Soft eraser',category:'Erasers',tool:'eraser',size:70,softness:.8,settings:{}},
];
