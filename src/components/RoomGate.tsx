import { UI_TEXT } from '../constants';

export function RoomGate() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-3 text-lg font-semibold text-gray-900">
          {UI_TEXT.roomGateTitle}
        </h1>
        <p className="mb-2 text-sm text-gray-700">{UI_TEXT.roomGateDescription}</p>
        <p className="text-xs text-gray-500">{UI_TEXT.roomGateExample}</p>
      </div>
    </div>
  );
}
