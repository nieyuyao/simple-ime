import { flatten } from 'lodash-es';
import { dict, packedTrie } from './google_pinyin_dict_utf8_55320';
import { PTrie } from 'dawg-lookup';


const typedDict = dict;

const trie = new PTrie(packedTrie);
const getCandidates = (input) => {
  let list = []

  if (input) {
    const value = typedDict[input];
    if (value) {
      // full pinyin match, or abbr match.
      list = value.map((item) => {
        return {
          ...item,
          matchLen: input.length
        }
      }) 
    } else if (input.length >= 1) {
      const completions = trie.completions(input)
      const tempList = completions.map((key) => {
        return typedDict[key] ? typedDict[key].map((item => {
          return {
            ...item,
            matchLen: key.length
          }
        })) : undefined
      })
      // pinyin prefix match, using prepared packed trie data.
      list = flatten(tempList);
    }

    //sort candidates by word frequency
    list = list
      .filter((item) => !!item)
      .sort((a, b) => b.f - a.f)
  }

  const candidates = list.map((item) => item.w);
  const matchLens = list.map((item) => item.matchLen);

  return [candidates, matchLens];
};

export default getCandidates;
