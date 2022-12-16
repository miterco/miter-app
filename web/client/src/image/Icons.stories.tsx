import {Card, Input} from 'antd';
import {useState} from 'react';
import * as Icons from './index';

export default {
  title: 'Icons',
};

export const Glyph = () => {
  const [filter, setFilter] = useState<string>('');
  const [color, setColor] = useState('#000000');

  const handleFilterChange = ({target: {value}}: {target: {value: string}}) => setFilter(value);
  const assignColorChange = (value: string) => setColor(value);
  const handleColorChange = ({target: {value}}: {target: {value: string}}) => assignColorChange(value);

  let keys = Object.keys(Icons);
  if (filter) {
    keys = keys.filter(key => key.toLowerCase().includes(filter.toLowerCase()));
  }

  return (
    <Card
      title={
        <div
          style={{
            padding: '1em',
          }}
        >
          <Input placeholder="Filter" type="text" value={filter} onChange={handleFilterChange} />
        </div>
      }
      extra={<input type="color" value={color} onChange={handleColorChange} />}
      bodyStyle={{display: 'flex', flexWrap: 'wrap', gap: '1em'}}
    >
      {keys.map((name: string) => {
        // @ts-ignore
        const Icon = Icons[name];
        return (
          <Card
            key={name}
            size="small"
            style={{
              flex: '200px 0 0',
              height: '100px',
            }}
            bodyStyle={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <Icon style={{color}} />
            <code>{name}</code>
          </Card>
        );
      })}
    </Card>
  );
};
