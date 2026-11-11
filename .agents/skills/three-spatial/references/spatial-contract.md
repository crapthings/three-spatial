# Measurement, dimensions and style

An object has position, pose and dimensions in a declared frame and measurement convention. Direction is a transformed local axis; angles express directional relationships. Scale and proportions are dimensionless. Style affects permitted geometric expression, while functional requirements constrain acceptable changes.

## Units

```json
{
  "coordinates": {
    "dimensions": 3,
    "unit": "scene-unit",
    "metersPerUnit": 1,
    "handedness": "right",
    "up": "+Y",
    "frame": "scene"
  }
}
```

Put this on an index's `coordinates`, or `root.userData.coordinates` without an index. Indexed scenes use the index convention. `1` is the one-meter example, `0.01` means one centimeter per scene length unit, and `null` means unknown physical scale. Unspecified scenes remain unknown. Legacy indexes explicitly declaring `unit: meter`/`meters` are interpreted as one meter per unit; conflicting conversions fail.

Changing the declaration changes physical interpretation; it does not automatically rescale geometry or preserve physical dimensions. Object `scale` is a separate dimensionless transform. Local coordinates require their full parent transforms before world/physical interpretation. The current geometry/orientation adapter uses Three.js right-handed Y-up coordinates; other index conventions are not silently converted by it.

`convert-length` accepts a finite scalar or numeric array and `from`/`to` of `scene-unit` or `meter`. It handles lengths/coordinate components only, not area, volume, angles or changing coordinate frames. Meter conversion fails when physical scale is unknown.

## Dimension kinds

- `dimensions.design`: authored `{size: [x,y,z], unit: 'scene-unit', frame, scope}`. Scope matters: a door opening differs from the installed door's extent or traversable clearance.
- `dimensions.functional`: declared requirements, e.g. `[{id, minimumSize: [x,y,z], unit: 'scene-unit', frame}]`. They are not measured evidence or automatic navigation checks.
- `localGeometry`: measured static vertices in the queried object's own unscaled coordinates, including descendant transforms but excluding the queried object's/ancestors' transforms. Unit is `object-local-unit`; do not directly label it meters.
- `worldAabb`: measured extents along world X/Y/Z after transforms. It changes with rotation and is not intrinsic semantic width/height/depth. `sizeMeters` is null when physical scale is unknown.

Arrays use X/Y/Z order. A fused mesh's whole AABB cannot be substituted for one semantic region's dimensions. `dimensions.edit.mode` declares `generator`, `source-code`, `uniform-scale` or `none`; it does not execute a resize. Widening a shelf may require changing board spans and product slots while preserving products and board thickness, rather than stretching the assembly.

## Style and inheritance

A scene or part may declare:

```json
{
  "style": {
    "geometry": "lowpoly",
    "proportions": "stylized",
    "adjustable": ["label proportions"],
    "preserve": ["functional clearance", "product dimensions"]
  }
}
```

Lowpoly simplification does not itself imply exaggerated proportions. Proportion policy is `realistic`, `stylized` or `unspecified`. `describe-spatial-intent` merges style along semantic ancestry: more specific fields override, protection lists accumulate, and identically named protected entries are removed from `adjustable`. Parent design dimensions are not inherited as child dimensions.

These lists are author intent, not a general geometric constraint solver. Low-level transforms do not enforce every policy. Functional restrictions take precedence during a style edit; an explicitly requested redesign may change the underlying requirements, which then need their own verification. A scene without style metadata does not acquire an inferred style.

Keep units on the scene and intent on meaningful components/generators. Store necessary sparse overrides; derive live world dimensions on demand or cache by scene revision. Neither a database nor more JSON metadata alone establishes spatial correctness.

For dimensions relative to usable container interiors, directional padding, relative clearance and style-dependent density, see [layout.md](layout.md). Design extents and contact checks do not by themselves establish content fit or visual layout quality.
