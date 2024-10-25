type ContextArgumentMap = Map<Concept['part_of_speech'], ContextArgumentName[]>

type Option = ContextArgumentValue
type Options = Set<Option>
type FilterMap = Map<ContextArgumentName, Options>
type FilterRulesMap = Map<Concept['part_of_speech'], FilterMap>
