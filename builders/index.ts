/**
 * Built-in builder registrations.
 *
 * To add a new builder in a fork, either:
 *   1. Add it here (if upstreaming) — import your component and call registerBuilder.
 *   2. Import this file then call registerBuilder() yourself in main.tsx BEFORE
 *      the React tree mounts — no core files need to be modified.
 *
 * Example:
 *   import './builders';                         // register built-ins first
 *   import { registerBuilder } from './builders/registry';
 *   import { DockerBuilder } from './components/DockerBuilder';
 *   registerBuilder({ id: 'docker', label: 'docker', component: DockerBuilder });
 */
import { registerBuilder } from './registry';

import { AnsibleBuilder } from '../components/AnsibleBuilder';
import { BashBuilder } from '../components/BashBuilder';
import { ChmodBuilder } from '../components/ChmodBuilder';
import { CronBuilder } from '../components/CronBuilder';
import { FfmpegBuilder } from '../components/FfmpegBuilder';
import { FindBuilder } from '../components/FindBuilder';
import { GitBuilder } from '../components/GitBuilder';
import { GrepBuilder } from '../components/GrepBuilder';
import { IpBuilder } from '../components/IpBuilder';
import { LxcBuilder } from '../components/LxcBuilder';
import { RsyncBuilder } from '../components/RsyncBuilder';
import { ScpBuilder } from '../components/ScpBuilder';
import { SedBuilder } from '../components/SedBuilder';
import { UfwBuilder } from '../components/UfwBuilder';

registerBuilder({ id: 'ansible-playbook', label: 'ansible-playbook', component: AnsibleBuilder });
registerBuilder({ id: 'bash',             label: 'bash',             component: BashBuilder });
registerBuilder({ id: 'chmod',            label: 'chmod',            component: ChmodBuilder });
registerBuilder({ id: 'crontab',          label: 'crontab',          component: CronBuilder });
registerBuilder({ id: 'ffmpeg',           label: 'ffmpeg',           component: FfmpegBuilder });
registerBuilder({ id: 'find',             label: 'find',             component: FindBuilder });
registerBuilder({ id: 'git',              label: 'git',              component: GitBuilder });
registerBuilder({ id: 'grep',             label: 'grep',             component: GrepBuilder });
registerBuilder({ id: 'ip',               label: 'ip',               component: IpBuilder });
registerBuilder({ id: 'lxc',              label: 'lxc',              component: LxcBuilder });
registerBuilder({ id: 'rsync',            label: 'rsync',            component: RsyncBuilder });
registerBuilder({ id: 'scp',              label: 'scp',              component: ScpBuilder });
registerBuilder({ id: 'sed',              label: 'sed',              component: SedBuilder });
registerBuilder({ id: 'ufw',              label: 'ufw',              component: UfwBuilder });
