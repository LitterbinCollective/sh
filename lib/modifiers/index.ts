import CutoffModifier from './cutoff';
import DurationModifier from './duration';
import EchoModifier from './echo';
import HighpassModifier from './highpass';
import LFOPitchModifier from './lfopitch';
import LFOVolumeModifier from './lfovolume';
import LowpassModifier from './lowpass';
import PitchModifier from './pitch';
import RealmModifier from './realm';
import RepeatModifier from './repeat';
import SelectModifier from './select';
import StartposModifier from './startpos';
import VolumeModifier from './volume';

export { default as BaseModifier } from './basemodifier';

export const defaultModifiers = {
  cutoff: CutoffModifier,
  duration: DurationModifier,
  echo: EchoModifier,
  highpass: HighpassModifier,
  lfopitch: LFOPitchModifier,
  lfovolume: LFOVolumeModifier,
  lowpass: LowpassModifier,
  pitch: PitchModifier,
  realm: RealmModifier,
  rep: RepeatModifier,
  repeat: RepeatModifier,
  select: SelectModifier,
  skip: StartposModifier,
  startpos: StartposModifier,
  volume: VolumeModifier,
};
