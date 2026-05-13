# Computer Vision Course Update Design

Date: 2026-05-13

## Goal

Update the portfolio with the computer vision course work under `C:/coding/计算机视觉`, covering four lab experiments and one final course paper experiment. The update should appear in the course archive and blog sections, not as new portfolio projects.

## Source Material

- `C:/coding/计算机视觉/实验1/实验1报告.md`: CIFAR-10 classification with ResNet18, GPU training, checkpointing, and prediction visualization.
- `C:/coding/计算机视觉/实验2/实验2报告.md`: ISBI-style medical image segmentation with Otsu baseline, U-Net, Dice loss, and mask prediction visualization.
- `C:/coding/计算机视觉/实验3/实验3报告.md`: Human pose estimation with DeepPose coordinate regression, HRNet heatmaps, keypoint decoding, and skeleton visualization.
- `C:/coding/计算机视觉/实验4/实验4报告.md`: UCF101 action recognition with C3D, GPU smoke training, small training loop, checkpointing, evaluation, and loss curve.
- `C:/coding/计算机视觉/cv_course_paper/docs/*.md`: Final paper experiment around lightweight YOLO26n object detection, model selection, model-size constraints, class-2 small-object bottlenecks, crop augmentation, and test-set analysis.

## Chosen Approach

Use a two-part update.

First, revise `src/content/projects/course-archive-computer-vision.md` as the course archive entry. It remains a `课程归档` item and becomes a compact index of the full course sequence:

- image classification;
- semantic segmentation;
- human pose estimation;
- action recognition;
- lightweight object detection final paper experiment.

Second, add one synthesis blog post at `src/content/blog/computer-vision-course-lab-retrospective.md`. The post should not copy the lab reports. It should abstract the labs into a coherent learning and engineering path: dataset preparation, augmentation, CNN/ResNet training, pixel-level segmentation, heatmap decoding, video spatiotemporal modeling, lightweight detector selection, constrained optimization, and failure analysis.

## Content Positioning

The course archive entry answers: what was completed and where the source material lives.

The blog post answers: what capability path these experiments demonstrate and how the raw course work was converted into portfolio-level narrative.

The project section should not receive a new card in this update. The final YOLO experiment has enough engineering detail to be mentioned strongly in the course archive and blog, but it remains part of the course sequence rather than an independent product or research prototype.

## Data And Routing

No collection schema changes are required.

- Course archive content continues to use the existing `projects` collection with `category: "课程归档"`.
- Blog content uses the existing `blog` collection and `category: "项目复盘"`.
- No new page routes or components are required.

## Validation

After implementation:

- run `npm test`;
- run `npm run build`;
- fix any frontmatter, Markdown, or Astro content errors.

## Out Of Scope

- Adding a new project card for the final YOLO experiment.
- Uploading large experiment artifacts, datasets, checkpoints, or rendered course-paper assets into the portfolio repository.
- Changing site layout, visual design, navigation, collection schema, or deployment configuration.
