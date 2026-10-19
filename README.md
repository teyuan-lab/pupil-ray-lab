# Pupil & Ray Lab

Live demo: https://teyuan-lab.github.io/pupil-ray-lab/

Dependency-free classroom demonstration of chief rays, entrance and exit pupils, and eye relief using exact sequential spherical-surface ray tracing.

## Systems and controls

Keplerian telescope, two-element eyepiece with an upstream objective, illustrative rifle scope with a 1:1 erecting relay, and Galilean telescope. Adjust objective/ocular power parameters, diaphragm diameter and position, object field, defocus, glass index, and eye position/pupil diameter. Presets are teaching prescriptions, not reproductions of commercial optics. The objective parameter is a nominal thin-lens value; the table provides the actual thick spherical prescription. The ocular parameter specifies the approximate singlet focal length (or the scale of the two-element ocular).

The diaphragm position control now extends in front of the entire system, up to one nominal objective focal length before the first lens. Its readout is the actual x coordinate in mm; negative x is in object space. Positive travel places it in the first air gap. Ray launch positions and layout bounds follow the diaphragm.

## Physics

Each ray intersects spherical surface caps and refracts by vector Snell's law. Rays that miss a surface, clip an aperture or undergo total internal reflection are stopped. Chief rays are numerically aimed through the active aperture-stop center. The actual paraxial aperture stop is found by comparing on-axis collimated-ray acceptance at every clear aperture. It can switch from the adjustable diaphragm to a lens rim.

Entrance and exit pupils are Gaussian images of that stop, evaluated by infinitesimal ray tracing through the same surfaces in reverse and forward directions. Pupil diameter is calculated from transverse magnification. Real/virtual pupil status and signed eye relief from the final surface vertex are shown. Dashed green probe rays visualize pupil imaging; their finite-angle aberration can leave small residual errors at the paraxial pupil. Marginal field rays can vignette even when the paraxial stop calculation is valid.

All prescriptions are paraxially focused by thick-element focal distances; the relay has equal object and image conjugates. The two-element ocular's front focal plane is calculated by reverse tracing. Glass index changes regenerate focal spacing; defocus shifts the final ocular only. The moving eye is a reduced optical eye with an internal iris pupil, one equivalent spherical refracting surface, homogeneous interior and a curved retina. Its Gaussian entrance pupil (the image of the internal iris through the front refractor) is positioned at the instrument exit pupil by default; the whole eye moves with the axial/lateral controls. The eye panel is a magnified meridional side view, not an irradiance image. Accepted rays continue through the refracting eye surface to the orange retina. The close-up shows only the exit-pupil region, eye and ray segments; instrument elements and the last-surface marker are omitted. The green marker is the instrument exit pupil; the purple iris is inside the eye and its gap is the eye pupil. Blue ray segments enter the gap; red ones terminate at the iris. Both axes use one constant equal scale (4.6 SVG units/mm); a 10 mm ruler is shown. A fixed-width camera pans to include the exit pupil and the translating eye without stretching or resizing the eye. The capture count refers to the 17 sampled rays of the selected field, not a photometric throughput fraction. An alignment button resets the eye offsets for a real external exit pupil; it is disabled for an inaccessible pupil. No diffraction, dispersion, Fresnel losses or commercial-design optimization.

## Run and verify

Open `index.html` directly, or run `node serve.cjs` and visit http://127.0.0.1:8795. Run `node verify.cjs` for the physics checks and parameter sweep. No installation/build required.

Sources: [Ansys chief-ray definition](https://ansyshelp.ansys.com/public/Views/Secured/Zemax/v25101/en/OpticStudio_User_Guide/OpticStudio_Help/topics/Chief_Ray.html), [Edmund Optics telescope optics](https://www.edmundoptics.com/knowledge-center/application-notes/optics/telescope-optics-for-hobbyists/).

Publish repository root on `main` through GitHub Pages (Deploy from a branch).

The main exit-pupil marker is drawn above rays and eye markers, with a full plane guide, diameter end caps, real/virtual styling and an explicit diameter/position label.

## Moving eye and retinal image

The reduced eye has n = 4/3, fixed power 57 D, spherical radius R = (n-1)/P (with consistent units), and a fixed posterior retinal vertex 22.222 mm after the surface vertex. The retina is a sphere of radius 12 mm, centered 10.222 mm after that vertex. The physical iris/pupil is placed 3 mm behind the equivalent front vertex. This is an illustrative internal iris position. At 57 D its apparent entrance pupil lies about 2.58 mm behind the front vertex; zero eye offset aligns that entrance-pupil image with the instrument exit pupil. The displayed eye pupil diameter is the physical iris-opening diameter. One surface represents the combined focusing action of cornea and crystalline lens, rather than a full anatomical prescription. [NUS reduced-eye teaching reference](https://phyweb.physics.nus.edu.sg/~physoc/beta/archived/resources/pyp/pc1142/PC1142_1112_Q.pdf).

Eye focusing power is fixed at 57 D for every system; no adjustment control is exposed. The retina remains fixed. Instrument rays first refract at the front surface, then intersect the internal iris plane and are clipped against the circular eye pupil. Accepted rays continue to the posterior retinal hemisphere; blocked meridional rays stop at the iris in the diagrams. Eye overlap with the instrument is invalid and suppresses the retinal image.

The retinal window traces an asymmetric F target (0.84 degrees tall) with 37 deterministic equal-area circular-aperture samples per lit target cell. It uses full 3D intersections, exact refraction, circular aperture clipping and a two-variable shooting solve through the stop. Transmitted instrument rays are cached while moving the eye. The display is the physical transverse projection of retinal hits (not perceived orientation), with fixed display exposure, geometric sample counts and a selectable viewport. Small display splats aid visibility; they are not a diffraction PSF. Sample counts are not calibrated photometric throughput. Coarse sampling can leave visible dots.

Run node verify-eye.cjs for reduced-eye focus and clipping, retinal sphere intersections, agreement with the meridional engine, rotational symmetry and all-system target capture.
