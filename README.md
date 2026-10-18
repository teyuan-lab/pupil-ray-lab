# Pupil & Ray Lab

Live demo: https://teyuan-lab.github.io/pupil-ray-lab/

Dependency-free classroom demonstration of chief rays, entrance and exit pupils, and eye relief using exact sequential spherical-surface ray tracing.

## Systems and controls

Keplerian telescope, two-element eyepiece with an upstream objective, illustrative rifle scope with a 1:1 erecting relay, and Galilean telescope. Adjust objective/ocular power parameters, diaphragm diameter and position, object field, defocus, glass index, and eye position/aperture. Presets are teaching prescriptions, not reproductions of commercial optics. The objective parameter is a nominal thin-lens value; the table provides the actual thick spherical prescription. The ocular parameter specifies the approximate singlet focal length (or the scale of the two-element ocular).

## Physics

Each ray intersects spherical surface caps and refracts by vector Snell's law. Rays that miss a surface, clip an aperture or undergo total internal reflection are stopped. Chief rays are numerically aimed through the active aperture-stop center. The actual paraxial aperture stop is found by comparing on-axis collimated-ray acceptance at every clear aperture. It can switch from the adjustable diaphragm to a lens rim.

Entrance and exit pupils are Gaussian images of that stop, evaluated by infinitesimal ray tracing through the same surfaces in reverse and forward directions. Pupil diameter is calculated from transverse magnification. Real/virtual pupil status and signed eye relief from the final surface vertex are shown. Dashed green probe rays visualize pupil imaging; their finite-angle aberration can leave small residual errors at the paraxial pupil. Marginal field rays can vignette even when the paraxial stop calculation is valid.

All prescriptions are paraxially focused by thick-element focal distances; the relay has equal object and image conjugates. The two-element ocular's front focal plane is calculated by reverse tracing. Glass index changes regenerate focal spacing; defocus shifts the final ocular only. The eye is a circular aperture represented by its meridional section, without an eye lens. The intercept panel is a meridional sample, not an irradiance image. Horizontal positions in that panel identify the sampled stop coordinate; vertical positions are ray heights at the eye plane. No diffraction, dispersion, Fresnel losses or commercial-design optimization.

## Run and verify

Open `index.html` directly, or run `node serve.cjs` and visit http://127.0.0.1:8795. Run `node verify.cjs` for the physics checks and parameter sweep. No installation/build required.

Sources: [Ansys chief-ray definition](https://ansyshelp.ansys.com/public/Views/Secured/Zemax/v25101/en/OpticStudio_User_Guide/OpticStudio_Help/topics/Chief_Ray.html), [Edmund Optics telescope optics](https://www.edmundoptics.com/knowledge-center/application-notes/optics/telescope-optics-for-hobbyists/).

Publish repository root on `main` through GitHub Pages (Deploy from a branch).
